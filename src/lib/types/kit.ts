export interface KitProduct {
  id: string;
  name: string;
  brand: string;
  imageUrl: string | null;
}

export interface KitItemData {
  id: string;
  order: number;
  product: KitProduct;
}

export interface KitWithItems {
  id: string;
  name: string;
  specialty: string | null;
  isSystem: boolean;
  favoriteId: string;
  items: KitItemData[];
}
