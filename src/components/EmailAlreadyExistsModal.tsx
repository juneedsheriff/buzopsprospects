'use client';

import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface EmailAlreadyExistsModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function EmailAlreadyExistsModal({ opened, onClose }: EmailAlreadyExistsModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Email already exists"
      centered
      radius="md"
    >
      <Stack gap="md">
        <Group gap="sm" align="flex-start" wrap="nowrap">
          <IconAlertCircle size={22} className="shrink-0 text-[#DC2626]" />
          <Text size="sm">
            This email has already been submitted. Please use a different email address or contact support if you need help.
          </Text>
        </Group>

        <Group justify="flex-end">
          <Button onClick={onClose}>OK</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
