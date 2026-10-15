export function attendreUnPayloadEmballe(
  invoke: jest.Mock,
  avertissement: string,
): string {
  const [messages] = invoke.mock.calls[0] as [
    Array<{ role: string; content: string }>,
  ];
  expect(messages[0]).toEqual({ role: 'system', content: avertissement });
  const utilisateur = messages.filter(({ role }) => role === 'user');
  expect(utilisateur).toHaveLength(1);
  expect(utilisateur[0].content).toMatch(
    /^<user_data>\n\{.*\}\n<\/user_data>$/s,
  );
  return utilisateur[0].content;
}
