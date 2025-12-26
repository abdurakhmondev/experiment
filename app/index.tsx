import { UniversalDateTimeInput } from '@/components/datepicker';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

export default function Screen() {
  const { control, watch } = useForm({
    defaultValues: {
      date: new Date(),
      dateTime: new Date(),
    },
  });

  console.log(watch('dateTime'));

  return (
    <View style={{ padding: 20 }}>
      <Controller
        name="date"
        control={control}
        render={({ field }) => (
          <UniversalDateTimeInput
            value={field.value}
            onChange={field.onChange}
            mode="date"
          />
        )}
      />

      <Controller
        name="dateTime"
        control={control}
        render={({ field }) => (
          <UniversalDateTimeInput
            value={field.value}
            onChange={field.onChange}
            mode="datetime"
          />
        )}
      />
    </View>
  );
}
