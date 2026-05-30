import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Controller, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';

import {loginInputSchema, type LoginInput} from '@collab/api-contracts';

import {Button, Input} from '@/components';
import {colors, fontSize, spacing} from '@/global/theme';
import {useAuth} from '@/hooks';
import {Screen} from '@/layout';

// Port of apps/web/src/features/auth/components/LoginForm.tsx — same schema,
// same resolver, same "Invalid credentials" root error on failure.
export function LoginScreen() {
  const {login} = useAuth();
  const {
    control,
    handleSubmit,
    setError,
    formState: {errors, isSubmitting},
  } = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: {email: '', password: ''},
  });

  const onSubmit = handleSubmit(async values => {
    try {
      await login(values.email, values.password);
    } catch {
      setError('root', {message: 'Invalid credentials'});
    }
  });

  return (
    <Screen edges={['top', 'bottom']} keyboardAvoiding>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Collab</Text>
          <Text style={styles.subtitle}>Sign in to your workspace</Text>
        </View>

        <Controller
          control={control}
          name="email"
          render={({field: {onChange, onBlur, value}}) => (
            <Input
              label="Email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({field: {onChange, onBlur, value}}) => (
            <Input
              label="Password"
              secureTextEntry
              autoComplete="current-password"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              onSubmitEditing={onSubmit}
              error={errors.password?.message}
            />
          )}
        />

        {errors.root ? (
          <Text style={styles.rootError}>{errors.root.message}</Text>
        ) : null}

        <Button title="Sign in" loading={isSubmitting} onPress={onSubmit} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  header: {marginBottom: spacing.md, gap: spacing.xs},
  title: {fontSize: fontSize['2xl'], fontWeight: '700', color: colors.foreground},
  subtitle: {fontSize: fontSize.base, color: colors.mutedForeground},
  rootError: {fontSize: fontSize.sm, color: colors.destructive},
});
