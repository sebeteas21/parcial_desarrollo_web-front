import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8080
FACULTIES = []
PROGRAMS = []
NEXT_FACULTY_ID = 1
NEXT_PROGRAM_ID = 1


class FacultyHandler(SimpleHTTPRequestHandler):
    def _send_json(self, status, payload):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode('utf-8'))

    def do_GET(self):
        if self.path == '/api/facultades':
            self._send_json(200, FACULTIES)
            return

        if self.path == '/api/programas':
            self._send_json(200, PROGRAMS)
            return

        return super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')

        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            self._send_json(400, {'message': 'JSON inválido'})
            return

        if self.path == '/api/facultades':
            nombre = data.get('nombre', '').strip()
            decano = data.get('decano', '').strip()
            ubicacion = data.get('ubicacion', '').strip()

            if not nombre or not decano or not ubicacion:
                self._send_json(400, {'message': 'Los campos nombre, decano y ubicacion son obligatorios.'})
                return

            global NEXT_FACULTY_ID
            faculty = {
                'id': NEXT_FACULTY_ID,
                'nombre': nombre,
                'decano': decano,
                'ubicacion': ubicacion,
            }
            NEXT_FACULTY_ID += 1
            FACULTIES.append(faculty)
            self._send_json(201, faculty)
            return

        if self.path == '/api/programas':
            nombre = data.get('nombre', '').strip()
            duracion = data.get('duracion', '').strip()
            facultad_id = data.get('facultadId')

            if not nombre or not duracion or facultad_id is None:
                self._send_json(400, {'message': 'Los campos nombre, duracion y facultadId son obligatorios.'})
                return

            try:
                facultad_id = int(facultad_id)
            except (ValueError, TypeError):
                self._send_json(400, {'message': 'facultadId debe ser un número válido.'})
                return

            faculty = next((f for f in FACULTIES if f['id'] == facultad_id), None)
            if not faculty:
                self._send_json(400, {'message': 'La facultad seleccionada no existe.'})
                return

            global NEXT_PROGRAM_ID
            program = {
                'id': NEXT_PROGRAM_ID,
                'nombre': nombre,
                'duracion': duracion,
                'facultadId': facultad_id,
                'facultadNombre': faculty['nombre'],
            }
            NEXT_PROGRAM_ID += 1
            PROGRAMS.append(program)
            self._send_json(201, program)
            return

        return super().do_POST()

    def log_message(self, format, *args):
        return


if __name__ == '__main__':
    directory = os.path.dirname(os.path.abspath(__file__))
    handler_class = FacultyHandler
    handler_class.directory = directory

    server = HTTPServer(('0.0.0.0', PORT), handler_class)
    print(f'Servidor local iniciado en http://localhost:{PORT}')
    server.serve_forever()
