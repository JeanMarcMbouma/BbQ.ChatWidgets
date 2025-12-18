/**
 * Fetch Helper Module
 * Provides utility functions for making HTTP requests
 */

export async function fetchPost(url) {
  try {
    const response = await fetch(url, { method: 'POST' });
    return response.ok;
  } catch (error) {
    console.error('Fetch error:', error);
    return false;
  }
}

export async function fetchGet(url) {
  try {
    const response = await fetch(url, { method: 'GET' });
    return response.ok;
  } catch (error) {
    console.error('Fetch error:', error);
    return false;
  }
}
