# Actividad 3 - Ciberseguridad: nube, contenedores y autenticación

Proyecto académico que integra:

- **IaC con Terraform:** bucket S3 cifrado (AES-256), sin acceso público y con política TLS, sobre LocalStack.
- **Contenedores con Trivy:** comparación de `node:14` contra una imagen vigente (`node:24-alpine`).
- **Sitio web con API:** Node.js, Express y JWT, con validación en endpoints sensibles, evaluado con OWASP ZAP.
- **Política IAM** de mínimo privilegio (`s3:GetObject`).

## Estructura

| Carpeta | Contenido |
|---|---|
| `terraform/` | `main.tf` (S3), `iam.tf` (rol y política), `iam-policy.json` |
| `app/` | Sitio web (`public/`), API (`server.js`) y Dockerfiles |
| `zap/` | Definición OpenAPI y reportes de OWASP ZAP (API y sitio) |
| `evidencias/` | Reportes de Trivy |
| `docs/` | Diagrama de arquitectura |
| `scripts/` | `resumen.sh`: resumen de vulnerabilidades por imagen |

## Requisitos

Docker, Terraform, Trivy, AWS CLI, Node.js y una cuenta gratuita de LocalStack.

> **Credenciales y uso:** el repositorio no incluye credenciales reales. Los usuarios
> y contraseñas de la aplicación son solo de demostración; configura `JWT_SECRET`
> mediante una variable de entorno y no guardes secretos en archivos. El token de
> LocalStack también debe proporcionarse mediante `LOCALSTACK_AUTH_TOKEN`. Las
> claves `test`/`test` de `main.tf` son valores ficticios para LocalStack. Esta
> aplicación es educativa y no debe usarse en producción.

## Cómo ejecutarlo

### 1. LocalStack e infraestructura

```bash
docker run -d --name localstack -p 4566:4566 -e LOCALSTACK_AUTH_TOKEN="$LOCALSTACK_AUTH_TOKEN" localstack/localstack
cd terraform
terraform init
terraform apply
aws --endpoint-url=http://localhost:4566 s3api get-bucket-policy-status --bucket actividad3-seguro-2024
```

### 2. Contenedor y análisis con Trivy

```bash
cd app
docker build -t act3-api .
docker run -d --name act3-api -p 3000:3000 -e JWT_SECRET="$(openssl rand -hex 32)" act3-api
../scripts/resumen.sh act3-api
```

### Variable de entorno JWT_SECRET

`JWT_SECRET` es obligatoria; la aplicación termina con error si no está definida
o está vacía. Genérala al ejecutar la aplicación:

```bash
# Local (desde app/)
JWT_SECRET=$(openssl rand -hex 32) node server.js

# Docker
docker run -e JWT_SECRET="$(openssl rand -hex 32)" -p 3000:3000 act3-api
```

### 3. Sitio web

Abrir `http://localhost:3000`. Usuarios de demostración (ficticios): `user` y `admin`.
El panel de administración solo responde con el rol `admin` (403 para `user`).

### 4. OWASP ZAP

```bash
cd zap
docker run --rm --network host -u root -v $(pwd):/zap/wrk:rw ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://localhost:3000 -r reporte_zap_sitio.html -I
```

## Resultados principales

| Imagen | CRITICAL | HIGH |
|---|---|---|
| `node:14` (inicial) | 23 | 572 |
| `act3-api` (final, `node:24-alpine`) | 0 | 0 |

- Bucket S3: `IsPublic: false`, cifrado `AES256`, bloqueo de acceso público activo.
- JWT: 401 sin token o con token falso, 403 con rol insuficiente, 200 con rol correcto.
- ZAP: 0 alertas High en la API y en el sitio.

## Aviso

Proyecto con fines educativos. Los usuarios y contraseñas son solo de demostración,
`JWT_SECRET` debe configurarse mediante una variable de entorno y la aplicación no
debe usarse en producción.
