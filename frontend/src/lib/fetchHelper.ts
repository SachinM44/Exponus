import { BACKEND_URL } from '../config';

/**
 * Helper function for making fetch requests with proper headers and error handling
 * This is a direct alternative to apiClient for problematic endpoints
 */
export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  // Get the auth token
  const token = localStorage.getItem('token');
  
  // Create a new options object to avoid mutating the original
  const updatedOptions = { ...options };
  
  // Prepare headers - ensure we have a Header object to work with
  const headers = new Headers(updatedOptions.headers || {});
  
  // Add authorization if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Always set Content-Type for POST and PUT requests with JSON bodies
  if (
    (updatedOptions.method === 'POST' || updatedOptions.method === 'PUT') && 
    updatedOptions.body && 
    typeof updatedOptions.body === 'string' && 
    !headers.has('Content-Type')
  ) {
    try {
      // Check if it's valid JSON
      JSON.parse(updatedOptions.body);
      headers.set('Content-Type', 'application/json');
    } catch (e) {
      // Not JSON, don't set application/json header
    }
  }
  
  // Update options with headers
  updatedOptions.headers = headers;
  
  console.log(`Sending request to ${endpoint}:`, { 
    method: updatedOptions.method,
    headers: Object.fromEntries(headers.entries()),
    body: updatedOptions.body
  });
  
  // Make the request
  const response = await fetch(`${BACKEND_URL}${endpoint}`, updatedOptions);
  
  // Handle non-ok responses
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Request failed with status ${response.status}: ${errorText}`);
  }
  
  // Parse JSON if possible
  try {
    return await response.json();
  } catch (e) {
    // Return raw response if not JSON
    return response;
  }
};

/**
 * Update like/dislike status for a blog post
 * @param blogId The ID of the blog post
 * @param value 1 for like, -1 for dislike, 0 for removing like/dislike
 */
export const updateLikeStatus = async (blogId: number, value: number): Promise<boolean> => {
  try {
    // Convert the numeric value to the string type expected by the backend
    let type: 'LIKE' | 'DISLIKE';
    
    if (value === 1) {
      type = 'LIKE';
    } else if (value === -1) {
      type = 'DISLIKE';
    } else {
      // If value is 0, we need to remove the like
      // The backend doesn't support this directly, so for now we'll just use LIKE
      // and handle the UI accordingly
      type = 'LIKE';
    }
    
    // The schema requires both type and blogId
    await fetchApi(`/api/v1/blog/${blogId}/like`, {
      method: 'POST',
      body: JSON.stringify({ 
        type,
        blogId: Number(blogId) // Ensure blogId is a number as required by the schema
      })
    });
    return true;
  } catch (error) {
    console.error("Error updating like status:", error);
    return false;
  }
};

/**
 * Add comment to a blog post
 */
export const addComment = async (blogId: number, content: string): Promise<boolean> => {
  try {
    await fetchApi(`/api/v1/blog/${blogId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    return true;
  } catch (error) {
    console.error("Error adding comment:", error);
    return false;
  }
};

/**
 * Test function to diagnose like request issues
 */
export const testLikeRequest = async (blogId: number, value: number): Promise<any> => {
  try {
    // Convert to type
    const type = value === 1 ? 'LIKE' : 'DISLIKE';
    
    console.log('Testing with blogId in body');
    const withBlogId = await fetch(`${BACKEND_URL}/api/v1/blog/${blogId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify({ 
        type,
        blogId: Number(blogId)
      })
    });
    
    const withBlogIdResult = await withBlogId.text();
    console.log('Result with blogId:', withBlogId.status, withBlogIdResult);
    
    console.log('Testing without blogId in body');
    const withoutBlogId = await fetch(`${BACKEND_URL}/api/v1/blog/${blogId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify({ type })
    });
    
    const withoutBlogIdResult = await withoutBlogId.text();
    console.log('Result without blogId:', withoutBlogId.status, withoutBlogIdResult);
    
    return {
      withBlogId: { status: withBlogId.status, result: withBlogIdResult },
      withoutBlogId: { status: withoutBlogId.status, result: withoutBlogIdResult }
    };
  } catch (error) {
    console.error("Test error:", error);
    return { error: String(error) };
  }
}; 