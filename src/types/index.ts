export interface AuthResponse {
  token: string;
  email: string;
  expiresAt: string;
}

export interface DeviceResponse {
  id: string;
  name: string;
  deviceUuid: string | null;
  isPaired: boolean;
  isOnline: boolean;
  lastHeartbeat: string | null;
  createdAt: string;
}

export interface PairingResponse {
  code: string;
  expiresAt: string;
}

export interface MediaResponse {
  id: string;
  fileName: string;
  fileType: string; // "Image" | "Video"
  blobUrl: string;
  thumbnailUrl: string | null;
  sizeInBytes: number;
  durationSeconds: number | null;
  uploadedAt: string;
}

export interface ScheduleItemResponse {
  id: string;
  mediaId: string;
  fileName: string;
  fileType: string;
  displayOrder: number;
  startTime: string; // "HH:mm:ss"
  endTime: string;
  displayDuration: number;
}

export interface ScheduleResponse {
  id: string;
  deviceId: string;
  deviceName: string;
  name: string;
  isActive: boolean;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  items: ScheduleItemResponse[];
}

export interface ScheduleItemRequest {
  mediaId: string;
  displayOrder: number;
  startTime: string; // "HH:mm:ss"
  endTime: string;
  displayDuration: number;
}

export interface ScheduleRequest {
  deviceId: string;
  name: string;
  isActive: boolean;
  timezone: string;
  items: ScheduleItemRequest[];
}

export interface ApiError {
  error: string;
  message: string;
}
