FROM node:22-alpine AS base

WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM base AS dev
CMD ["npm", "run", "serve"]

FROM base AS build
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS production
COPY --from=build /workspace/dist/angular-sandbox/browser /usr/share/nginx/html
EXPOSE 80
