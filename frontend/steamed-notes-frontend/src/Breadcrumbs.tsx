// Breadcrumb.tsx
import { useNavigate } from 'react-router-dom'

interface NavData {
  id: string,
  name: string,
}

interface NavPart {
  label: string,
  path: string
}

const Breadcrumb: React.FC<{
  room?: NavData
  folder?: NavData
  note?: NavData
}> = ({room=null, folder=null, note=null}) => {
  const navigate = useNavigate()

  var parts: NavPart[] = [{label:"root", path:"/rooms"}];

  if (room != null) {

    parts.push({label:room.name, path:`/rooms/${room.id}`})

    if (folder != null) {

      parts.push({label:folder.name, path:`/rooms/${room.id}/folders/${folder.id}`})

      if (note != null) {
        parts.push({label:note.name, path:`/rooms/${room.id}/folders/${folder.id}/notes/${note.id}`})
      }

    }
  }

  return (
    <nav className="text-sm text-gray-600 flex space-x-1 p-2">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center space-x-1">
          <span
            className="cursor-pointer hover:underline"
            onClick={() => navigate(p.path)}
          >
            {p.label}
          </span>
          {i < parts.length - 1 && <span className="text-gray-400">/</span>}
        </span>
      ))}
    </nav>
  )
}

export default Breadcrumb;

