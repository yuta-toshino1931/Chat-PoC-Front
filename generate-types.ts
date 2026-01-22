import { generate } from "openapi-typescript-codegen";

generate({
  input: "./api/swagger.yaml",
  output: "./src/api",
  httpClient: "fetch",
  useOptions: true,
});
