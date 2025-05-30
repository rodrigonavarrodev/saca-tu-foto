# Saca Tu Foto

Una aplicación web para escanear facturas usando la cámara del dispositivo.

## Características

- Captura de fotos usando la cámara del dispositivo
- Soporte para cámara trasera y frontal
- Vista previa de la imagen capturada
- Interfaz de usuario intuitiva y responsive
- Manejo de errores y estados de carga

## Requisitos Previos

- Node.js 18.0.0 o superior
- npm o yarn

## Instalación

1. Clona el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
cd saca-tu-foto
```

2. Instala las dependencias:
```bash
npm install
# o
yarn install
```

3. Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:
```env
NEXT_PUBLIC_API_URL=https://tu-api.com
```

## Desarrollo

Para iniciar el servidor de desarrollo:

```bash
npm run dev
# o
yarn dev
```

La aplicación estará disponible en `http://localhost:3000`

## Construcción para Producción

Para crear una versión optimizada para producción:

```bash
npm run build
# o
yarn build
```

Para iniciar la versión de producción:

```bash
npm run start
# o
yarn start
```

## Tecnologías Utilizadas

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Lucide Icons
- Shadcn/ui

## Estructura del Proyecto

```
saca-tu-foto/
├── app/
│   ├── page.tsx        # Página principal
│   └── layout.tsx      # Layout principal
├── components/
│   └── ui/            # Componentes de UI
├── public/            # Archivos estáticos
└── ...
```

## Notas Importantes

- La aplicación requiere permisos de cámara para funcionar
- Se recomienda usar en dispositivos móviles para mejor experiencia
- Asegúrate de tener una buena conexión a internet para el envío de facturas

## Soporte

Si encuentras algún problema o tienes alguna sugerencia, por favor abre un issue en el repositorio.

## Licencia

[MIT](LICENSE) 