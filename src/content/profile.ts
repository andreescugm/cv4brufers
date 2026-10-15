/**
 * ÚNICO ARCHIVO QUE NECESITAS EDITAR PARA COMPLETAR TUS DATOS.
 * Todo lo marcado con TODO es un dato personal que no se ha inventado.
 */
export const profile = {
  firstName: 'Gabriel',
  lastName: 'Andreescu',
  company: 'Andreescu Oakmont',
  companyWhat: 'implantación de IA y automatización comercial para pymes',
  city: 'Talavera de la Reina',

  /**
   * TODO: tu foto con traje. Colócala en /public/media/ (p. ej. gabriel.jpg)
   * y escribe aquí la ruta: '/media/gabriel.jpg'. Mientras sea null,
   * el Acto I muestra un marco vacío claramente marcado.
   */
  photo: '/media/gabriel-cut.webp' as string | null,

  contact: {
    /** TODO: tu móvil en formato internacional sin espacios, p. ej. '+34600000000'. */
    phone: null as string | null,
    /** Mensaje que se precarga en WhatsApp. */
    whatsappText: 'Hola Gabriel, hemos visto la web. Hablemos.',
    /** Confirma que quieres que este correo sea público. */
    email: 'andreescugm@proton.me' as string | null,
  },

  /**
   * Frase del cierre. Solo es cierta si la web se termina el mismo día en que se empezó
   * (se construyó el 15/10/2026). Si cambias mucho la web otro día, ajústala.
   */
  builtClaim: 'Todo esto se construyó en un día.',
}

export const whatsappHref = (): string | null => {
  const p = profile.contact.phone
  if (!p) return null
  const digits = p.replace(/[^\d]/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(profile.contact.whatsappText)}`
}
