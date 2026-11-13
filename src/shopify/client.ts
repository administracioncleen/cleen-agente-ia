import { config } from "../config";

const API_VERSION = "2025-01";

interface ShopifyVariant {
  title: string;
  sku: string | null;
  price: string;
  inventoryQuantity: number;
}

export interface ShopifyProduct {
  title: string;
  handle: string;
  status: string;
  minPrice: string;
  currencyCode: string;
  variants: ShopifyVariant[];
  url: string;
}

async function shopifyGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(
    `https://${config.shopify.storeDomain}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": config.shopify.adminAccessToken,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  if (!response.ok) {
    throw new Error(`Shopify API respondio ${response.status}: ${await response.text()}`);
  }

  const json = (await response.json()) as { data: T; errors?: unknown };
  if (json.errors) {
    throw new Error(`Shopify API devolvio errores: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

// El stock que el bot debe usar es solo el de config.shopify.locationName (hoy
// "Sucursal Shipit"), no la suma de todas las sucursales. El ID se resuelve una
// vez por nombre y se cachea en memoria para no consultarlo en cada mensaje.
let cachedLocationId: string | null = null;

async function getStockLocationId(): Promise<string> {
  if (cachedLocationId) return cachedLocationId;

  const query = `
    query FindLocation {
      locations(first: 50) {
        edges { node { id name } }
      }
    }
  `;

  const data = await shopifyGraphql<{
    locations: { edges: { node: { id: string; name: string } }[] };
  }>(query, {});

  const match = data.locations.edges.find(
    (edge) => edge.node.name.trim().toLowerCase() === config.shopify.locationName.trim().toLowerCase()
  );

  if (!match) {
    const names = data.locations.edges.map((e) => e.node.name).join(", ");
    throw new Error(
      `No se encontro la sucursal "${config.shopify.locationName}" en Shopify. Sucursales disponibles: ${names}`
    );
  }

  cachedLocationId = match.node.id;
  return cachedLocationId;
}

/**
 * Busca productos por texto libre (titulo, tag) y devuelve precio y stock en vivo
 * por variante. Es la unica fuente de verdad para precio/stock: nunca hardcodear
 * estos valores en el prompt porque cambian (ver nota en knowledge.ts). El stock
 * devuelto es solo el de la sucursal configurada (ver getStockLocationId), no el
 * total de todas las sucursales.
 */
export async function searchProducts(searchText: string, limit = 5): Promise<ShopifyProduct[]> {
  const locationId = await getStockLocationId();

  const query = `
    query SearchProducts($query: String!, $first: Int!, $locationId: ID!) {
      products(query: $query, first: $first) {
        edges {
          node {
            title
            handle
            status
            priceRangeV2 { minVariantPrice { amount currencyCode } }
            variants(first: 10) {
              edges {
                node {
                  title
                  sku
                  price
                  inventoryItem {
                    inventoryLevel(locationId: $locationId) {
                      quantities(names: ["available"]) { quantity }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyGraphql<{
    products: {
      edges: {
        node: {
          title: string;
          handle: string;
          status: string;
          priceRangeV2: { minVariantPrice: { amount: string; currencyCode: string } };
          variants: {
            edges: {
              node: {
                title: string;
                sku: string | null;
                price: string;
                inventoryItem: {
                  inventoryLevel: { quantities: { quantity: number }[] } | null;
                };
              };
            }[];
          };
        };
      }[];
    };
  }>(query, { query: searchText, first: limit, locationId });

  return data.products.edges.map(({ node }) => ({
    title: node.title,
    handle: node.handle,
    status: node.status,
    minPrice: node.priceRangeV2.minVariantPrice.amount,
    currencyCode: node.priceRangeV2.minVariantPrice.currencyCode,
    variants: node.variants.edges.map((v) => ({
      title: v.node.title,
      sku: v.node.sku,
      price: v.node.price,
      inventoryQuantity: v.node.inventoryItem.inventoryLevel?.quantities[0]?.quantity ?? 0,
    })),
    url: `${config.shopify.publicStoreUrl}/products/${node.handle}`,
  }));
}
