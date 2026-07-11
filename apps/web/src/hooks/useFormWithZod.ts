import { useForm, UseFormProps, UseFormReturn, FieldValues, Path, DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema } from 'zod';

export interface UseFormWithZodOptions<T extends FieldValues> extends Omit<UseFormProps<T>, 'resolver' | 'defaultValues'> {
  schema: ZodSchema<T>;
  defaultValues?: DefaultValues<T>;
}

export interface UseFormWithZodReturn<T extends FieldValues> extends UseFormReturn<T> {
  validateField: (name: Path<T>) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
  resetForm: (values?: DefaultValues<T>) => void;
}

export function useFormWithZod<T extends FieldValues>(
  options: UseFormWithZodOptions<T>
): UseFormWithZodReturn<T> {
  const { schema, defaultValues, ...rest } = options;

  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: 'onChange',
    ...rest,
  });

  const validateField = async (name: Path<T>) => {
    const result = await form.trigger(name);
    return result;
  };

  const validateForm = async () => {
    const result = await form.trigger();
    return result;
  };

  const resetForm = (values?: DefaultValues<T>) => {
    form.reset(values);
  };

  return {
    ...form,
    validateField,
    validateForm,
    resetForm,
  };
}

export default useFormWithZod;