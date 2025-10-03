import { NavLink } from 'react-router-dom'

const linkStyle = {
  padding: '0.5rem 1rem',
  borderRadius: '8px',
  textDecoration: 'none',
  color: 'inherit',
}

export default function Nav() {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'sticky', top: 0, backdropFilter: 'blur(6px)', background: 'rgba(36,36,36,0.6)', zIndex: 10 }}>
      <NavLink to="/user" style={({ isActive }) => ({ ...linkStyle, background: isActive ? '#646cff33' : 'transparent', border: isActive ? '1px solid #646cff' : '1px solid transparent' })}>User</NavLink>
      <NavLink to="/driver" style={({ isActive }) => ({ ...linkStyle, background: isActive ? '#646cff33' : 'transparent', border: isActive ? '1px solid #646cff' : '1px solid transparent' })}>Driver</NavLink>
      <NavLink to="/admin" style={({ isActive }) => ({ ...linkStyle, background: isActive ? '#646cff33' : 'transparent', border: isActive ? '1px solid #646cff' : '1px solid transparent' })}>Admin</NavLink>
    </div>
  )
}


