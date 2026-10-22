import { useRouter } from 'expo-router';
import { GAME_NAME } from '@/brand';
import { Button } from '@/components/Button';
import { Body, Eyebrow, ScreenFrame, Title } from '@/components/ui';

export default function NotFound() {
  const router = useRouter();
  return (
    <ScreenFrame footer={<Button label="Back to the start" onPress={() => router.replace('/')} />}>
      <Eyebrow>{GAME_NAME}</Eyebrow>
      <Title>This page is not at the table.</Title>
      <Body>The showdown is back on the title screen.</Body>
    </ScreenFrame>
  );
}
