// Quick Shopify API connection test
async function testShopify() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN

  console.log('Testing Shopify connection...')
  console.log('Domain:', domain || 'NOT SET')
  console.log('Token:', token ? token.substring(0, 15) + '...' : 'NOT SET')

  if (!domain || !token) {
    console.error('Missing credentials!')
    return
  }

  const url = `https://${domain}/admin/api/2024-01/graphql.json`
  console.log('URL:', url)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({
        query: `{ shop { name } }`
      }),
    })

    console.log('Status:', response.status)
    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))

    if (data.data?.shop?.name) {
      console.log('\n✅ SUCCESS! Connected to:', data.data.shop.name)
    } else {
      console.log('\n❌ FAILED:', data.errors || 'Unknown error')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

testShopify()
