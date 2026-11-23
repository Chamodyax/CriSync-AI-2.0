export interface EvidencePhotoMatch {
  src: string;
  caption: string;
}

export function resolveEvidencePhoto(
  fileName?: string | null,
  category?: string | null
): EvidencePhotoMatch {
  const lower = (fileName || '').toLowerCase();

  if (lower.includes('clinic') || lower.includes('water_level') || lower.includes('flood')) {
    return {
      src: '/images/evidence-clinic-flood.jpg',
      caption: 'Field Photo: Flooded Clinic & Rising Water Report'
    };
  }

  if (lower.includes('landslide') || lower.includes('road')) {
    return {
      src: '/images/evidence-landslide-road.jpg',
      caption: 'Field Photo: Landslide Road Obstruction Assessment'
    };
  }

  if (lower.includes('hall') || lower.includes('families') || lower.includes('shelter')) {
    return {
      src: '/images/evidence-parish-families.jpg',
      caption: 'Field Photo: Displaced Families at Community Hall'
    };
  }

  if (category === 'Medicine') {
    return {
      src: '/images/evidence-clinic-flood.jpg',
      caption: 'Field Medical Relief Photo'
    };
  }

  if (category === 'Shelter') {
    return {
      src: '/images/shelter-center.jpg',
      caption: 'Emergency Shelter Assessment Photo'
    };
  }

  if (category === 'Food' || category === 'Water') {
    return {
      src: '/images/appeal-fundraising.jpg',
      caption: 'Community Food & Water Relief Photo'
    };
  }

  return {
    src: '/images/hero-relief.jpg',
    caption: 'Active Humanitarian Relief Photo'
  };
}
