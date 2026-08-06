import { handleUpload } from '@vercel/blob/client';

export default async function handler(request, response) {
  const body = request.body;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Anyone visiting the site can request an upload token — this mirrors
        // the old open Firebase Storage rules. Lock this down later with
        // real auth if you want to restrict who can upload.
        return {
          allowedContentTypes: [
            'image/*',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB safety cap
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Blob upload completed:', blob.url);
      },
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    console.error('api/upload error:', error);
    return response.status(400).json({ error: error.message });
  }
}
