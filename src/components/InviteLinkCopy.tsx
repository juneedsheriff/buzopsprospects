'use client';

import { getProspectInviteUrl } from '@/lib/inviteLink';
import { ActionIcon, CopyButton, Group, Paper, Text, Tooltip } from '@mantine/core';
import { IconCheck, IconCopy, IconLink } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export default function InviteLinkCopy() {
  const [inviteUrl, setInviteUrl] = useState('');

  useEffect(() => {
    setInviteUrl(getProspectInviteUrl());
  }, []);

  if (!inviteUrl) {
    return null;
  }

  return (
    <Paper withBorder radius="md" p="md" className="border-[#BFDBFE] bg-[#EFF6FF]">
      <Group gap="xs" mb={6}>
        <IconLink size={16} className="text-[#2563EB]" />
        <Text fw={600} size="sm">Prospect invite link</Text>
      </Group>
      <Text size="sm" c="dimmed" mb="sm">
        Send this link to prospects. When they sign in with Google, their profile fills in automatically — no page refresh.
      </Text>
      <Group gap="xs" wrap="nowrap">
        <Text
          size="sm"
          className="min-w-0 flex-1 truncate rounded-md border border-[#BFDBFE] bg-white px-3 py-2 font-mono text-[#1E3A8A]"
        >
          {inviteUrl}
        </Text>
        <CopyButton value={inviteUrl}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Copied' : 'Copy link'} withArrow>
              <ActionIcon
                variant="light"
                color={copied ? 'teal' : 'blue'}
                size="lg"
                onClick={copy}
                aria-label="Copy invite link"
              >
                {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
    </Paper>
  );
}
