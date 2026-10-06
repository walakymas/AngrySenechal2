# Production image: builds the app, then serves dist/ with the hardened Express server (server.js).
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# environment.prod.ts is git-ignored: use the one in the build context, otherwise the example (set the API address!)
RUN [ -f src/environments/environment.prod.ts ] || cp src/environments/environment.prod.ts.example src/environments/environment.prod.ts
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production PORT=8080
WORKDIR /app
# the server needs only express and helmet (not the Angular toolchain)
COPY package.json ./
RUN node -e "const p=require('./package.json');require('fs').writeFileSync('package.json',JSON.stringify({name:p.name,private:true,dependencies:{express:p.dependencies.express,helmet:p.dependencies.helmet}}))" \
 && npm install --omit=dev --no-audit --no-fund
COPY --chown=node:node server.js ./
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 8080
# behind a TLS proxy keep REQUIRE_HTTPS on (default); set REQUIRE_HTTPS=false for plain http, see README.md
CMD ["node", "server.js"]
