import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  clearMocks: true,
  coverageDirectory: "coverage",
  verbose: true,
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/src/config/",
  ],
};

export default config;
