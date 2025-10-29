export const mockGoogleClient = {
  createPresentation: jest.fn().mockResolvedValue({ presentationId: 'test-id' }),
  batchUpdate: jest.fn().mockResolvedValue({}),
  setPermissions: jest.fn().mockResolvedValue({})
};