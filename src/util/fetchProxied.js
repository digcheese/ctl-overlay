/**
 * fetches a URL through a CORS proxy
 * they might pop on or off a free model at times so might need to change it out
 * TODO: probably add some kind of queue to get around rate limits if they exist for a given site
 * but probably fine for now
 */
export async function fetchProxied(url) {
  return fetch(`https://cors.io/?url=${encodeURIComponent(url)}`)
    .then(e => e.json())
    .then(e => ({
      ...JSON.parse(e?.body)
    }))
    .catch(() => ({
      success: false,
      data: undefined
    }))
}