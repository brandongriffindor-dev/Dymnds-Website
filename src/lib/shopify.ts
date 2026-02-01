const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

export async function shopifyFetch<T>({
  query,
  variables,
}: {
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  const endpoint = `https://${domain}/api/2024-01/graphql.json`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (json.errors) {
    console.error("Shopify API Error:", json.errors);
    throw new Error(json.errors[0]?.message || "Shopify API Error");
  }

  return json.data;
}

// Get all products
export async function getProducts() {
  const query = `
    query Products {
      products(first: 20) {
        edges {
          node {
            id
            title
            handle
            description
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await shopifyFetch<{
      products: {
        edges: Array<{
          node: {
            id: string;
            title: string;
            handle: string;
            description: string;
            priceRange: {
              minVariantPrice: {
                amount: string;
                currencyCode: string;
              };
            };
            images: {
              edges: Array<{
                node: {
                  url: string;
                  altText: string;
                };
              }>;
            };
            variants: {
              edges: Array<{
                node: {
                  id: string;
                };
              }>;
            };
          };
        }>;
      };
    }>({ query });

    return data.products.edges.map((edge) => edge.node);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

// Get single product by handle
export async function getProduct(handle: string) {
  const query = `
    query Product($handle: String!) {
      product(handle: $handle) {
        id
        title
        handle
        description
        descriptionHtml
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 10) {
          edges {
            node {
              url
              altText
            }
          }
        }
        variants(first: 100) {
          edges {
            node {
              id
              title
              availableForSale
              price {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
        options {
          name
          values
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    product: {
      id: string;
      title: string;
      handle: string;
      description: string;
      descriptionHtml: string;
      priceRange: {
        minVariantPrice: {
          amount: string;
          currencyCode: string;
        };
      };
      images: {
        edges: Array<{
          node: {
            url: string;
            altText: string;
          };
        }>;
      };
      variants: {
        edges: Array<{
          node: {
            id: string;
            title: string;
            availableForSale: boolean;
            price: {
              amount: string;
              currencyCode: string;
            };
            selectedOptions: Array<{
              name: string;
              value: string;
            }>;
          };
        }>;
      };
      options: Array<{
        name: string;
        values: string[];
      }>;
    };
  }>({ query, variables: { handle } });

  return data.product;
}

// Create checkout
export async function createCheckout(variantId: string, quantity: number = 1) {
  const query = `
    mutation CreateCheckout($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout {
          id
          webUrl
        }
        checkoutUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      lineItems: [
        {
          variantId,
          quantity,
        },
      ],
    },
  };

  const data = await shopifyFetch<{
    checkoutCreate: {
      checkout: {
        id: string;
        webUrl: string;
      };
      checkoutUserErrors: Array<{
        code: string;
        field: string[];
        message: string;
      }>;
    };
  }>({ query, variables });

  return data.checkoutCreate.checkout;
}
