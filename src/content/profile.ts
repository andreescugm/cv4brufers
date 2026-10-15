/** Datos personales de la web: este es el único archivo con información de contacto. */
import { asset } from '../lib/asset'

export const profile = {
  firstName: 'Gabriel',
  lastName: 'Andreescu',
  company: 'Andreescu Oakmont',
  companyWhat: 'implantación de IA y automatización comercial para pymes',
  city: 'Talavera de la Reina',

  /** Retrato recortado (fondo eliminado). Original en alta resolución fuera de /public. */
  photo: asset('media/gabriel-cut.webp') as string | null,

  contact: {
    phone: '+34642117961' as string | null,
    /** Mensaje que se precarga en WhatsApp. */
    whatsappText: 'Hola Gabriel, hemos visto la web. Hablemos.',
    email: 'andreescugm@proton.me' as string | null,
  },

  /** Frase del cierre: la web se construyó el 15/10/2026, en un día. */
  builtClaim: 'Todo esto se construyó en un día.',
}

export const whatsappHref = (): string | null => {
  const p = profile.contact.phone
  if (!p) return null
  const digits = p.replace(/[^\d]/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(profile.contact.whatsappText)}`
}
