const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export async function uploadImage(
  file: File,
): Promise<{ success: boolean; data?: { url: string }; error?: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('accessToken');

  try {
    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error?.message || 'Upload failed' };
    }

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error during upload' };
  }
}
