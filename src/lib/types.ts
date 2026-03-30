export interface Coach {
  id: string
  name: string
  title: string
  bio: string
  image_url: string
  is_active: boolean
  sort_order: number
}

export interface Event {
  id: string
  title: string
  description: string
  image_url: string
  date: string
  location: string
  registration_url: string
  is_published: boolean
  sort_order: number
}

export interface Article {
  id: string
  title: string
  excerpt: string
  content: string
  image_url: string
  published_at: string
  is_published: boolean
}

export interface Banner {
  id: string
  title: string
  subtitle: string
  image_url: string
  link_url: string
  is_active: boolean
  sort_order: number
}

export interface Course {
  id: string
  title: string
  description: string
  schedule: string
  location: string
  age_group: string
  image_url: string
  registration_url: string
  is_active: boolean
  sort_order: number
}

export interface SiteSettings {
  id: string
  site_name: string
  logo_url: string
  contact_email: string
  contact_phone: string
  facebook_url: string
  instagram_url: string
  youtube_url: string
  about_text: string
}
