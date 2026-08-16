import type { CarrierConfig, CarrierId, ConnectionType, Offer } from '@/types';

// ============================================================
// CENTRALIZED CARRIER / OFFER DATABASE
// Single source of truth for all carrier pricing and packages.
// Never duplicate this data inside components.
// ============================================================

export const CARRIERS: CarrierConfig[] = [
  {
    id: 'hutch',
    name: 'Hutch',
    connectionType: 'mobile',
    unlimitedOfferPrice: 200,
    unlimitedOfferName: 'Mobile Unlimited',
    standardRatePerGb: 1.0,
    packages: ['Hutch Telegram', 'Hutch Whatsapp', 'Hutch Zoom'],
  },
  {
    id: 'airtel',
    name: 'Airtel',
    connectionType: 'mobile',
    unlimitedOfferPrice: 200,
    unlimitedOfferName: 'Mobile Unlimited',
    standardRatePerGb: 1.0,
    packages: [
      'Airtel & Dialog TikTok',
      'Airtel ALL Social Packages',
      'Airtel Whatsapp',
      'Airtel Youtube Package',
      'Airtel Zoom',
    ],
  },
  {
    id: 'dialog',
    name: 'Dialog',
    connectionType: 'mobile',
    unlimitedOfferPrice: 200,
    unlimitedOfferName: 'Mobile Unlimited',
    standardRatePerGb: 1.0,
    packages: ['Dialog Whatsapp'],
  },
  {
    id: 'dialog_fixed',
    name: 'Dialog Fixed Connections',
    connectionType: 'fixed',
    unlimitedOfferPrice: 300,
    unlimitedOfferName: 'Dialog Routers Unlimited',
    standardRatePerGb: 1.5,
    packages: ['Dialog Router Zoom'],
  },
  {
    id: 'slt',
    name: 'SLT',
    connectionType: 'fixed',
    unlimitedOfferPrice: 450,
    unlimitedOfferName: 'SLT Routers Unlimited',
    standardRatePerGb: 2.0,
    packages: ['SLT Netflix', 'SLT Zoom', 'SLT Zoom 235'],
  },
];

// Generate offers from carrier configs — single derivation, no duplication
export const OFFERS: Offer[] = CARRIERS.flatMap((carrier) => {
  const offers: Offer[] = [
    {
      id: `${carrier.id}-unlimited`,
      carrierId: carrier.id,
      name: carrier.unlimitedOfferName,
      connectionType: carrier.connectionType,
      price: carrier.unlimitedOfferPrice,
      isUnlimited: true,
    },
    {
      id: `${carrier.id}-standard`,
      carrierId: carrier.id,
      name: 'Standard Rate',
      connectionType: carrier.connectionType,
      price: 0,
      isUnlimited: false,
      ratePerGb: carrier.standardRatePerGb,
    },
    ...carrier.packages.map((pkg) => ({
      id: `${carrier.id}-${pkg.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      carrierId: carrier.id,
      name: pkg,
      connectionType: carrier.connectionType,
      price: carrier.unlimitedOfferPrice, // package price matches unlimited offer
      isUnlimited: true,
    })),
  ];
  return offers;
});

// ---------- Lookup helpers ----------

export function getCarrier(id: CarrierId): CarrierConfig | undefined {
  return CARRIERS.find((c) => c.id === id);
}

export function getOffersForCarrier(carrierId: CarrierId): Offer[] {
  return OFFERS.filter((o) => o.carrierId === carrierId);
}

export function getCarriersByConnectionType(type: ConnectionType): CarrierConfig[] {
  return CARRIERS.filter((c) => c.connectionType === type);
}

export function getOffer(id: string): Offer | undefined {
  return OFFERS.find((o) => o.id === id);
}

/**
 * Calculate the selling price for a client based on carrier, connection type,
 * offer, and data limit. Returns Rs amount.
 */
export function calculateClientPrice(
  carrierId: CarrierId,
  offerId: string | null,
  dataLimitGb: number,
  customRate?: { mobile: number; fixed: number }
): number {
  const carrier = getCarrier(carrierId);
  if (!carrier) return 0;
  const offer = offerId ? getOffer(offerId) : undefined;

  if (offer && offer.isUnlimited) {
    return offer.price;
  }

  // Standard rate or custom rate per GB
  const ratePerGb =
    customRate !== undefined
      ? carrier.connectionType === 'mobile'
        ? customRate.mobile
        : customRate.fixed
      : carrier.standardRatePerGb;

  const gb = dataLimitGb > 0 ? dataLimitGb : 0;
  return Math.round(gb * ratePerGb);
}
