import City from '../experiments/City'
import Jungle from '../experiments/Jungle'
import ObjectLab from '../experiments/ObjectLab'
import Product from '../experiments/Product'
import TypeCollision from '../experiments/TypeCollision'
import './act4.css'

const INDEX = [
  ['La jungla', 'Escena 3D cinematográfica', '#exp-jungla'],
  ['Producto', 'Presentación de producto', '#exp-producto'],
  ['La ciudad', 'Mundo procedural', '#exp-ciudad'],
  ['Colisión', 'Tipografía en movimiento', '#exp-tipografia'],
  ['El objeto', 'Interacción directa', '#exp-objeto'],
]

export default function Act4Proof() {
  return (
    <section id="acto-4" className="act4" aria-labelledby="a4-title">
      <header className="a4-intro">
        <h2 id="a4-title" className="display">
          La prueba
        </h2>
        <p className="a4-lede">Cinco experimentos. Cada uno enseña algo distinto que sé construir.</p>
        <ol className="a4-index">
          {INDEX.map(([name, what, href]) => (
            <li key={href}>
              <a href={href}>
                <span className="display">{name}</span>
                <span>{what}</span>
              </a>
            </li>
          ))}
        </ol>
      </header>
      <Jungle />
      <Product />
      <City />
      <TypeCollision />
      <ObjectLab />
    </section>
  )
}
