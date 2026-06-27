import fs from "fs";
import path from "path";

import { safeJoin } from "../utils/pathUtils.js";

export default class DependencyAgent {
  constructor(repoPath, readFileSafe) {
    this.repoPath = repoPath;
    this.readFileSafe = readFileSafe;
  }

  fileExists(relativePath) {
    return fs.existsSync(safeJoin(this.repoPath, relativePath));
  }

  readFile(relativePath) {
    try {
      return fs.readFileSync(safeJoin(this.repoPath, relativePath), "utf8");
    } catch {
      return "";
    }
  }

  writeFile(relativePath, content) {
    const absolutePath = safeJoin(this.repoPath, relativePath);
    fs.writeFileSync(absolutePath, content);
  }

  appendIfMissing(relativePath, dependencyLine) {
    const current = this.readFile(relativePath);

    if (current.includes(dependencyLine)) {
      return false;
    }

    const next =
      current.trim().length === 0
        ? `${dependencyLine}\n`
        : `${current.trim()}\n${dependencyLine}\n`;

    this.writeFile(relativePath, next);
    return true;
  }

  detectDependencyFiles() {
    return {
      nodePackageJson: this.fileExists("package.json"),
      pythonRequirements: this.fileExists("requirements.txt"),
      pythonPyproject: this.fileExists("pyproject.toml"),
      pythonSetupPy: this.fileExists("setup.py"),
      javaPom: this.fileExists("pom.xml"),
      javaGradle: this.fileExists("build.gradle"),
      javaGradleKts: this.fileExists("build.gradle.kts"),
      dotnetCsproj: fs
        .readdirSync(this.repoPath)
        .some((file) => file.endsWith(".csproj")),
      goMod: this.fileExists("go.mod"),
      phpComposer: this.fileExists("composer.json"),
      rubyGemfile: this.fileExists("Gemfile"),
      rustCargo: this.fileExists("Cargo.toml"),
      swiftPackage: this.fileExists("Package.swift")
    };
  }

  run(repoAnalysis) {
    const primaryLanguage = String(repoAnalysis.primaryLanguage || "").toLowerCase();
    const dependencyFiles = this.detectDependencyFiles();

    const result = {
      generatedAt: new Date().toISOString(),
      primaryLanguage,
      createdFiles: [],
      updatedFiles: [],
      skipped: [],
      recommendations: []
    };

    switch (primaryLanguage) {
      case "javascript":
      case "typescript":
        return this.ensureNodeDependencies(result, dependencyFiles, primaryLanguage);

      case "python":
        return this.ensurePythonDependencies(result, dependencyFiles);

      case "java":
        return this.ensureJavaDependencies(result, dependencyFiles);

      case "csharp":
      case "c#":
      case "cs":
      case "dotnet":
        return this.ensureDotnetDependencies(result, dependencyFiles);

      case "go":
        return this.ensureGoDependencies(result, dependencyFiles);

      case "php":
        return this.ensurePhpDependencies(result, dependencyFiles);

      case "ruby":
        return this.ensureRubyDependencies(result, dependencyFiles);

      case "rust":
        return this.ensureRustDependencies(result, dependencyFiles);

      case "swift":
        return this.ensureSwiftDependencies(result, dependencyFiles);

      case "kotlin":
        return this.ensureKotlinDependencies(result, dependencyFiles);

      case "htmlcss":
      case "html":
      case "css":
        return this.ensureHtmlCssDependencies(result, dependencyFiles);

      default:
        result.skipped.push(`No dependency automation configured for ${primaryLanguage}`);
        return result;
    }
  }

  ensureNodeDependencies(result, dependencyFiles, primaryLanguage) {
    if (!dependencyFiles.nodePackageJson) {
      const isTypeScript = primaryLanguage === "typescript";

      const packageJson = {
        type: "module",
        scripts: {
          test: isTypeScript ? "vitest run" : "node test.js"
        },
        devDependencies: isTypeScript
          ? {
              typescript: "^5.0.0",
              vitest: "^1.0.0"
            }
          : {}
      };

      this.writeFile("package.json", `${JSON.stringify(packageJson, null, 2)}\n`);
      result.createdFiles.push("package.json");
      return result;
    }

    const packageJson = this.readFile("package.json");

    if (
      primaryLanguage === "typescript" &&
      !/vitest|jest|mocha/i.test(packageJson)
    ) {
      result.recommendations.push(
        "TypeScript project has package.json but no obvious test framework. Consider adding Vitest."
      );
    }

    result.skipped.push("package.json already exists; not overwritten.");
    return result;
  }

  ensurePythonDependencies(result, dependencyFiles) {
    if (
      dependencyFiles.pythonRequirements ||
      dependencyFiles.pythonPyproject ||
      dependencyFiles.pythonSetupPy
    ) {
      if (dependencyFiles.pythonRequirements) {
        const changed = this.appendIfMissing("requirements.txt", "pytest");

        if (changed) {
          result.updatedFiles.push("requirements.txt");
        } else {
          result.skipped.push("requirements.txt already contains pytest.");
        }
      } else {
        result.recommendations.push(
          "Python dependency file exists, but not requirements.txt. Ensure pytest is declared in pyproject.toml or setup.py."
        );
      }

      return result;
    }

    this.writeFile("requirements.txt", "pytest\n");
    result.createdFiles.push("requirements.txt");
    return result;
  }

  ensureJavaDependencies(result, dependencyFiles) {
    if (dependencyFiles.javaPom || dependencyFiles.javaGradle || dependencyFiles.javaGradleKts) {
      result.skipped.push("Java build file already exists; not modified automatically.");
      result.recommendations.push(
        "Ensure JUnit 5 is configured in pom.xml or Gradle build file."
      );
      return result;
    }

    this.writeFile(
      "pom.xml",
      `<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>qa.agent.generated</groupId>
  <artifactId>generated-java-project</artifactId>
  <version>1.0.0</version>

  <properties>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <junit.jupiter.version>5.10.2</junit.jupiter.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <version>\${junit.jupiter.version}</version>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-surefire-plugin</artifactId>
        <version>3.2.5</version>
      </plugin>
    </plugins>
  </build>
</project>
`
    );

    result.createdFiles.push("pom.xml");
    return result;
  }

  ensureDotnetDependencies(result, dependencyFiles) {
    if (dependencyFiles.dotnetCsproj) {
      result.skipped.push(".csproj already exists; not modified automatically.");
      result.recommendations.push(
        "Ensure xUnit, xUnit runner and Microsoft.NET.Test.Sdk are referenced."
      );
      return result;
    }

    result.recommendations.push(
      "No .csproj found. Create a test project with: dotnet new xunit"
    );

    return result;
  }

  ensureGoDependencies(result, dependencyFiles) {
    if (dependencyFiles.goMod) {
      result.skipped.push("go.mod already exists.");
      return result;
    }

    this.writeFile(
      "go.mod",
      `module qa-agent-generated

go 1.22
`
    );

    result.createdFiles.push("go.mod");
    return result;
  }

  ensurePhpDependencies(result, dependencyFiles) {
    if (dependencyFiles.phpComposer) {
      result.skipped.push("composer.json already exists; not modified automatically.");
      result.recommendations.push("Ensure phpunit/phpunit is required in require-dev.");
      return result;
    }

    this.writeFile(
      "composer.json",
      `${JSON.stringify(
        {
          require: {},
          "require-dev": {
            "phpunit/phpunit": "^10.0"
          },
          scripts: {
            test: "phpunit"
          }
        },
        null,
        2
      )}\n`
    );

    result.createdFiles.push("composer.json");
    return result;
  }

  ensureRubyDependencies(result, dependencyFiles) {
    if (dependencyFiles.rubyGemfile) {
      result.skipped.push("Gemfile already exists; not modified automatically.");
      result.recommendations.push("Ensure rspec or minitest is declared.");
      return result;
    }

    this.writeFile(
      "Gemfile",
      `source "https://rubygems.org"

gem "rspec"
`
    );

    result.createdFiles.push("Gemfile");
    return result;
  }

  ensureRustDependencies(result, dependencyFiles) {
    if (dependencyFiles.rustCargo) {
      result.skipped.push("Cargo.toml already exists.");
      return result;
    }

    this.writeFile(
      "Cargo.toml",
      `[package]
name = "qa_agent_generated"
version = "0.1.0"
edition = "2021"

[dependencies]
`
    );

    result.createdFiles.push("Cargo.toml");
    return result;
  }

  ensureSwiftDependencies(result, dependencyFiles) {
    if (dependencyFiles.swiftPackage) {
      result.skipped.push("Package.swift already exists.");
      return result;
    }

    this.writeFile(
      "Package.swift",
      `// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "QAAssessedPackage",
    products: [
        .library(name: "QAAssessedPackage", targets: ["QAAssessedPackage"])
    ],
    targets: [
        .target(name: "QAAssessedPackage"),
        .testTarget(
            name: "QAAssessedPackageTests",
            dependencies: ["QAAssessedPackage"]
        )
    ]
)
`
    );

    result.createdFiles.push("Package.swift");
    return result;
  }

  ensureKotlinDependencies(result, dependencyFiles) {
    if (dependencyFiles.javaGradle || dependencyFiles.javaGradleKts || dependencyFiles.javaPom) {
      result.skipped.push("Kotlin/Java build file already exists; not modified automatically.");
      result.recommendations.push(
        "Ensure Kotlin test or JUnit 5 dependencies are configured."
      );
      return result;
    }

    this.writeFile(
      "build.gradle.kts",
      `plugins {
    kotlin("jvm") version "1.9.22"
}

repositories {
    mavenCentral()
}

dependencies {
    testImplementation(kotlin("test"))
}

tasks.test {
    useJUnitPlatform()
}
`
    );

    result.createdFiles.push("build.gradle.kts");
    return result;
  }

  ensureHtmlCssDependencies(result, dependencyFiles) {
    if (dependencyFiles.nodePackageJson) {
      result.skipped.push("package.json already exists.");
      result.recommendations.push(
        "For HTML/CSS testing, ensure Playwright, Cypress, jsdom or another DOM/browser test runner is configured."
      );
      return result;
    }

    this.writeFile(
      "package.json",
      `${JSON.stringify(
        {
          type: "module",
          scripts: {
            test: "echo \"No HTML/CSS test runner configured\""
          },
          devDependencies: {}
        },
        null,
        2
      )}\n`
    );

    result.createdFiles.push("package.json");
    result.recommendations.push(
      "Static HTML/CSS projects need Playwright, Cypress, jsdom or a similar runner for meaningful automated tests."
    );

    return result;
  }
}