# Runbook — Realtime service degraded or down

**Symptom paths:** clients see "Connecting…" or "Offline" indicators; document edits stop syncing; presence avatars disappear.

**Page severity:** SEV-2 (degraded UX) → SEV-1 (complete outage).

---

## Initial triage (5 min)

1. **Check the dashboard:** Grafana → "Realtime / Golden Signals"
   - WebSocket connection count
   - Connect / disconnect rate
   - p95 latency on `doc:update`
   - Error rate

2. **Check pod state:**
   ```bash
   kubectl -n collab get pods -l app=realtime
   kubectl -n collab logs -l app=realtime --tail=200 | grep -iE 'error|fatal'
   ```

3. **Check Redis adapter health:**
   ```bash
   redis-cli -h <redis> info clients
   redis-cli -h <redis> info stats | grep total_connections_received
   ```

## Common root causes

| Symptom | Likely cause | Action |
| --- | --- | --- |
| All pods OOMKilled | Hot doc with too many editors | Bump memory limits; investigate doc id in logs |
| Connections plateau at ~8000/pod | File descriptor / connection ceiling | Scale out (`kubectl scale ... --replicas=N`); raise `net.core.somaxconn` if persistent |
| Reconnect storm | Bad deploy / network blip | Confirm no recent deploy; check ALB target health |
| Redis adapter errors | ElastiCache failover in progress | Wait 60s; if persistent, page Redis on-call |
| Sticky session broken | LB misconfig | Verify ALB stickiness annotation; check target group attribute |

## Mitigation playbook

### A. Scale out

```bash
kubectl -n collab scale deploy/realtime --replicas=10
```

### B. Restart with rolling update

```bash
kubectl -n collab rollout restart deploy/realtime
kubectl -n collab rollout status deploy/realtime
```

The `terminationGracePeriodSeconds: 60` lets in-flight clients reconnect to other pods before the old pod dies.

### C. Roll back

```bash
kubectl argo rollouts undo realtime -n collab
```

### D. Block hot doc (last resort)

If a single document is causing OOMs:

```bash
redis-cli SET "doc:blocked:<docId>" 1 EX 3600
```

The gateway checks this on `doc:join` and rejects with `503`. Notify the workspace owner.

## Post-incident

- Open ticket in Linear with full timeline.
- Update this runbook if the failure mode was new.
- Write a brief postmortem if SEV-1.
- Schedule chaos drill for the discovered failure mode.
