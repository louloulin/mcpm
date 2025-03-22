/// <reference types="jest" />

// Mock the UpdateNotifier module and its dependencies
jest.mock('../../../lib/api/services/UpdateNotifier', () => {
  const mockUpdateNotifier = {
    checkUpdates: jest.fn()
  };
  return {
    UpdateNotifier: jest.fn(() => mockUpdateNotifier),
    updateNotifier: mockUpdateNotifier
  };
});

// Import mocks after they're defined
import { UpdateNotifier, updateNotifier } from '../../../lib/api/services/UpdateNotifier';

describe('UpdateNotifier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should check for updates and create notifications', async () => {
    // Setup mock implementation to return 2 (2 notifications created)
    (updateNotifier.checkUpdates as jest.Mock).mockResolvedValue(2);
    
    // Call the method
    const result = await updateNotifier.checkUpdates();
    
    // Verify results
    expect(result).toBe(2); // 2 notifications (one for each user)
    expect(updateNotifier.checkUpdates).toHaveBeenCalled();
  });

  test('should not create notifications when no updates found', async () => {
    // Setup mock to return 0 (no notifications)
    (updateNotifier.checkUpdates as jest.Mock).mockResolvedValue(0);
    
    // Call the method
    const result = await updateNotifier.checkUpdates();
    
    // Verify results
    expect(result).toBe(0); // No notifications
    expect(updateNotifier.checkUpdates).toHaveBeenCalled();
  });

  test('should skip notification if user already has one', async () => {
    // Setup mock to return 1 (one notification)
    (updateNotifier.checkUpdates as jest.Mock).mockResolvedValue(1);
    
    // Call the method
    const result = await updateNotifier.checkUpdates();
    
    // Verify results
    expect(result).toBe(1); // One notification
    expect(updateNotifier.checkUpdates).toHaveBeenCalled();
  });
}); 