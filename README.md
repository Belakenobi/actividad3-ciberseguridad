
## Nota sobre el secreto JWT

`server.js` usa un valor de ejemplo cuando no se define `JWT_SECRET`. No es una clave real.
En cualquier uso fuera de esta práctica, define `JWT_SECRET` con un valor aleatorio:

```bash
docker run -d --name act3-api -p 3000:3000 -e JWT_SECRET="$(openssl rand -hex 32)" act3-api
```
