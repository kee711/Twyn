export async function debugFetch(url: string, options?: RequestInit) {
  console.group(`[DEBUG FETCH] ${url}`);
  console.log('Current page URL:', window.location.href);
  console.log('Current pathname:', window.location.pathname);
  console.log('Request URL:', url);
  console.log('Full request URL:', new URL(url, window.location.origin).href);
  
  try {
    const response = await fetch(url, options);
    console.log('Response status:', response.status);
    console.log('Response URL:', response.url);
    console.log('Response type:', response.type);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error('Response not OK:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
    }
    
    console.groupEnd();
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    console.groupEnd();
    throw error;
  }
}