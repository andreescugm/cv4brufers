import Act1American from './acts/Act1American'
import Act2Why from './acts/Act2Why'
import Act3Sales from './acts/Act3Sales'
import Act4Proof from './acts/Act4Proof'
import Act5Close from './acts/Act5Close'
import Nav from './components/Nav'

export default function App() {
  return (
    <>
      <a className="skip" href="#contacto">
        Saltar al contacto
      </a>
      <Nav />
      <main>
        <Act1American />
        <Act2Why />
        <Act3Sales />
        <Act4Proof />
        <Act5Close />
      </main>
    </>
  )
}
