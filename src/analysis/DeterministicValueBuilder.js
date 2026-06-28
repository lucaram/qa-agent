export default class DeterministicValueBuilder {
  constructor() {}

  buildValidArgs(functionName, parameters = [], context = {}) {
    return parameters.map((parameterName) =>
      this.buildValidValue(functionName, parameterName, context)
    );
  }

  buildInvalidArgsForCondition(
    functionName,
    parameters = [],
    condition = "",
    context = {}
  ) {
    const conditionText = String(condition || "").trim();

    const mergedContext = {
      ...context,
      condition: conditionText,
      conditions: [
        ...(Array.isArray(context.conditions) ? context.conditions : []),
        conditionText
      ].filter(Boolean)
    };

    const args = this.buildValidArgs(functionName, parameters, mergedContext);

    if (!conditionText) return args;

    const directObjectResult = this.applyInvalidObjectPath({
      args,
      parameters,
      condition: conditionText,
      context: mergedContext
    });

    if (directObjectResult.applied) return directObjectResult.args;

    const comparativeResult = this.applyComparativeCondition({
      args,
      parameters,
      condition: conditionText,
      context: mergedContext
    });

    if (comparativeResult.applied) return comparativeResult.args;

    const lookupResult = this.applyMissingLookupCondition({
      args,
      parameters,
      condition: conditionText,
      context: mergedContext
    });

    if (lookupResult.applied) return lookupResult.args;

    const targetIndex = this.findBestParameterIndex(parameters, conditionText);

    if (targetIndex === -1) return args;

    args[targetIndex] = this.buildInvalidScalarValue({
      parameterName: parameters[targetIndex],
      condition: conditionText,
      context: mergedContext
    });

    return args;
  }

  buildValidValue(functionName, parameterName, context = {}) {
    const name = String(parameterName || "");
    const shape = this.buildObjectShapeForRoot(name, context);

    if (this.shouldBeArrayParameter(name, context)) {
      const itemShape = this.buildArrayItemShape(name, context);
      return [Object.keys(itemShape).length ? itemShape : this.defaultObject()];
    }

    if (
      Object.keys(shape).length > 0 ||
      this.shouldBeObjectParameter(name, context)
    ) {
      return Object.keys(shape).length ? shape : this.defaultObject(name);
    }

    return this.buildValidScalarValue({
      parameterName: name,
      propertyName: name,
      context
    });
  }

  buildObjectShapeForRoot(rootName, context = {}) {
    const object = {
      ...this.buildSemanticObjectShape(rootName, context)
    };

    const paths = this.extractKnownPaths(context).filter((path) =>
      this.sameName(path.root, rootName)
    );

    for (const path of paths) {
      this.setPathValue(
        object,
        path.properties,
        this.buildValidScalarValue({
          parameterName: rootName,
          propertyName: path.properties.at(-1),
          condition: path.source,
          context
        })
      );
    }

    const requiredProperties = this.extractRequiredPropertiesForRoot(
      rootName,
      context
    );

    for (const property of requiredProperties) {
      if (object[property] === undefined) {
        object[property] = this.buildValidScalarValue({
          parameterName: rootName,
          propertyName: property,
          context
        });
      }
    }

    return object;
  }

  buildSemanticObjectShape(rootName, context = {}) {
    const name = String(rootName || "").toLowerCase();
    const tokens = this.nameTokens(name);
    const object = {};

    if (tokens.has("order")) {
      return {
        id: "id-1",
        side: this.extractAllowedStringValueForName("side", context) || "BUY",
        type: this.extractAllowedStringValueForName("type", context) || "STANDARD",
        status: this.extractAllowedStringValueForName("status", context) || "ACTIVE",
        symbol: "ABC",
        ticker: "ABC",
        quantity: 10,
        limitPrice: 10,
        price: 10,
        amount: 100,
        market: "UK",
        exchange: "LSE",
        country: "UK",
        currency: "GBP",
        settlementCurrency: "GBP",
        instrumentCurrency: "GBP"
      };
    }

    if (tokens.has("position")) {
      return {
        id: "id-1",
        symbol: "ABC",
        ticker: "ABC",
        quantity: 10,
        averagePrice: 10,
        price: 10,
        value: 100,
        marketValue: 100,
        currency: "GBP"
      };
    }

    if (tokens.has("account")) {
      return {
        id: "id-1",
        accountId: "account-1",
        type: "STANDARD",
        status: "ACTIVE",
        balance: 1000,
        cashBalance: 1000,
        currency: "GBP"
      };
    }

    if (tokens.has("portfolio")) {
      return {
        id: "id-1",
        portfolioId: "portfolio-1",
        value: 1000,
        totalValue: 1000,
        marketValue: 1000,
        cashBalance: 1000,
        currency: "GBP"
      };
    }

    if (tokens.has("client") || tokens.has("customer") || tokens.has("user")) {
      return {
        id: "id-1",
        clientId: "client-1",
        name: "value",
        email: "user@example.com",
        status: "ACTIVE",
        type: "STANDARD",
        country: "UK"
      };
    }

    if (tokens.has("instrument") || tokens.has("asset") || tokens.has("security")) {
      return {
        id: "id-1",
        symbol: "ABC",
        ticker: "ABC",
        type: "STANDARD",
        status: "ACTIVE",
        currency: "GBP",
        market: "UK",
        exchange: "LSE",
        price: 10
      };
    }

    return object;
  }

  buildArrayItemShape(parameterName, context = {}) {
    const singular = this.singularise(parameterName);
    const shapeFromSingular = this.buildObjectShapeForRoot(singular, context);

    if (Object.keys(shapeFromSingular).length > 0) {
      return shapeFromSingular;
    }

    const paths = this.extractKnownPaths(context);
    const object = {};

    for (const path of paths) {
      for (const property of path.properties) {
        if (object[property] === undefined) {
          object[property] = this.buildValidScalarValue({
            parameterName,
            propertyName: property,
            condition: path.source,
            context
          });
        }
      }
    }

    return object;
  }

  applyInvalidObjectPath({ args, parameters, condition, context = {} }) {
    const paths = this.extractConditionPaths(condition);

    for (const path of paths) {
      const rootIndex = this.findParameterIndex(parameters, path.root);
      if (rootIndex === -1) continue;

      const nextArgs = this.deepClone(args);

      if (!this.isPlainObject(nextArgs[rootIndex])) {
        nextArgs[rootIndex] = this.buildObjectShapeForRoot(path.root, context);
      }

      this.setPathValue(
        nextArgs[rootIndex],
        path.properties,
        this.buildInvalidScalarValue({
          parameterName: path.root,
          propertyName: path.properties.at(-1),
          condition,
          context
        })
      );

      return { applied: true, args: nextArgs };
    }

    return { applied: false, args };
  }

  applyComparativeCondition({ args, parameters, condition }) {
    const nextArgs = this.deepClone(args);
    const text = String(condition || "");

    const match = text.match(
      /\b([A-Za-z_$][\w$]*)\s*(>=|<=|>|<)\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+)\b/
    );

    if (!match) return { applied: false, args };

    const leftName = match[1];
    const operator = match[2];
    const rightPath = match[3];

    const leftIndex = this.findParameterIndex(parameters, leftName);
    if (leftIndex === -1) return { applied: false, args };

    const rightValue = this.resolvePathFromArgs(rightPath, parameters, nextArgs);
    if (typeof rightValue !== "number") return { applied: false, args };

    nextArgs[leftIndex] = operator.includes(">") ? rightValue + 1 : rightValue - 1;

    return { applied: true, args: nextArgs };
  }

  applyMissingLookupCondition({ args, parameters, condition, context = {} }) {
    const lowered = String(condition || "").toLowerCase();

    if (!lowered.includes("undefined") && !lowered.includes("null")) {
      return { applied: false, args };
    }

    const nextArgs = this.deepClone(args);

    const arrayIndex = parameters.findIndex((parameter, index) =>
      Array.isArray(nextArgs[index])
    );

    const objectIndex = parameters.findIndex((parameter, index) =>
      this.isPlainObject(nextArgs[index])
    );

    if (arrayIndex === -1 || objectIndex === -1 || arrayIndex === objectIndex) {
      return { applied: false, args };
    }

    if (nextArgs[arrayIndex].length === 0) {
      nextArgs[arrayIndex] = [
        this.buildArrayItemShape(parameters[arrayIndex], context)
      ];
    }

    nextArgs[objectIndex] = {};

    return { applied: true, args: nextArgs };
  }

  buildValidScalarValue({
    parameterName = "",
    propertyName = "",
    condition = "",
    context = {}
  } = {}) {
    const name = String(propertyName || parameterName || "");
    const loweredName = name.toLowerCase();
    const lowered = `${name} ${condition}`.toLowerCase();

    if (this.scalarNameLooksNumeric(loweredName)) {
      return this.buildNumericValueForName(loweredName);
    }

    const enumValue = this.extractAllowedStringValueForName(name, context);
    if (enumValue !== null) return enumValue;

    if (this.scalarNameLooksString(loweredName)) {
      return this.buildStringValueForName(loweredName);
    }

    if (
      lowered.includes("boolean") ||
      loweredName.startsWith("is") ||
      loweredName.startsWith("has") ||
      loweredName.startsWith("can") ||
      loweredName.startsWith("should")
    ) {
      return true;
    }

    return 10;
  }

  buildNumericValueForName(name) {
    const tokens = this.nameTokens(name);

    if (tokens.has("rate")) return 0.2;
    if (tokens.has("percent") || tokens.has("percentage")) return 10;
    if (tokens.has("ratio")) return 0.25;

    if (tokens.has("index") || tokens.has("day")) return 1;
    if (tokens.has("age")) return 30;

    if (
      tokens.has("quantity") ||
      tokens.has("count") ||
      tokens.has("units") ||
      tokens.has("unit") ||
      tokens.has("shares") ||
      tokens.has("share") ||
      tokens.has("number") ||
      tokens.has("size") ||
      tokens.has("length")
    ) {
      return 10;
    }

    if (
      tokens.has("price") ||
      tokens.has("amount") ||
      tokens.has("value") ||
      tokens.has("total") ||
      tokens.has("cost") ||
      tokens.has("fee") ||
      tokens.has("charge") ||
      tokens.has("charges") ||
      tokens.has("tax") ||
      tokens.has("dividend") ||
      tokens.has("limit") ||
      tokens.has("threshold") ||
      tokens.has("minimum") ||
      tokens.has("maximum") ||
      tokens.has("min") ||
      tokens.has("max") ||
      tokens.has("exposure") ||
      tokens.has("asset") ||
      tokens.has("assets")
    ) {
      return 100;
    }

    if (
      tokens.has("balance") ||
      tokens.has("cash") ||
      tokens.has("capital") ||
      tokens.has("funds")
    ) {
      return 1000;
    }

    return 10;
  }

  buildStringValueForName(name) {
    const tokens = this.nameTokens(name);

    if (tokens.has("currency")) return "GBP";
    if (tokens.has("market")) return "UK";
    if (tokens.has("country")) return "UK";
    if (tokens.has("exchange")) return "LSE";
    if (tokens.has("locale")) return "en-GB";

    if (tokens.has("email")) return "user@example.com";
    if (tokens.has("date")) return "2026-01-01";

    if (tokens.has("side")) return "BUY";
    if (tokens.has("direction")) return "BUY";
    if (tokens.has("action")) return "BUY";

    if (tokens.has("type")) return "STANDARD";
    if (tokens.has("status")) return "ACTIVE";
    if (tokens.has("state")) return "ACTIVE";
    if (tokens.has("tier")) return "STANDARD";
    if (tokens.has("level")) return "STANDARD";

    if (tokens.has("symbol")) return "ABC";
    if (tokens.has("ticker")) return "ABC";
    if (tokens.has("code")) return "ABC";
    if (tokens.has("isin")) return "GB0000000001";
    if (tokens.has("sku")) return "SKU-1";

    if (tokens.has("account")) return "account-1";
    if (tokens.has("portfolio")) return "portfolio-1";
    if (tokens.has("position")) return "position-1";
    if (tokens.has("order")) return "order-1";
    if (tokens.has("client")) return "client-1";
    if (tokens.has("customer")) return "customer-1";
    if (tokens.has("user")) return "user-1";
    if (tokens.has("instrument")) return "instrument-1";

    if (tokens.has("id")) return "id-1";
    if (tokens.has("name")) return "value";
    if (tokens.has("description")) return "description";
    if (tokens.has("label")) return "label";

    return "value";
  }

  buildInvalidScalarValue({
    parameterName = "",
    propertyName = "",
    condition = "",
    context = {}
  } = {}) {
    const name = String(propertyName || parameterName || "").toLowerCase();
    const lowered = String(condition || "").toLowerCase();

    if (this.conditionTargetsMissingValue(lowered, name)) return null;
    if (this.conditionTargetsUndefined(lowered, name)) return undefined;

    if (this.conditionTargetsLessThanMinusHundred(lowered, name)) return -101;
    if (this.conditionTargetsGreaterThanHundred(lowered, name)) return 101;
    if (this.conditionTargetsGreaterThanOne(lowered, name)) return 2;
    if (this.conditionTargetsLessThanZero(lowered, name)) return -1;
    if (this.conditionTargetsLessThanOrEqualZero(lowered, name)) return 0;
    if (this.conditionTargetsEqualsZero(lowered, name)) return 0;

    if (lowered.includes("!")) return null;
    if (lowered.includes("undefined")) return undefined;
    if (lowered.includes("null")) return null;
    if (lowered.includes("<= 0")) return 0;
    if (lowered.includes("< -100")) return -101;
    if (lowered.includes("< 0")) return -1;
    if (lowered.includes("> 100")) return 101;
    if (lowered.includes("> 1")) return 2;
    if (lowered.includes("=== 0") || lowered.includes("== 0")) return 0;

    return -1;
  }

  conditionTargetsMissingValue(condition, name) {
    if (!name) return condition.includes("!");
    return (
      condition.includes(`!${name}`) ||
      condition.includes(`!${this.normaliseIdentifier(name)}`) ||
      condition.includes(`${name} is required`) ||
      condition.includes(`${name} required`)
    );
  }

  conditionTargetsUndefined(condition, name) {
    if (!name) return condition.includes("undefined");

    return (
      condition.includes(`${name} === undefined`) ||
      condition.includes(`${name} == undefined`)
    );
  }

  conditionTargetsLessThanOrEqualZero(condition, name) {
    return this.conditionHasOperatorForName(condition, name, "<= 0");
  }

  conditionTargetsLessThanZero(condition, name) {
    return this.conditionHasOperatorForName(condition, name, "< 0");
  }

  conditionTargetsGreaterThanHundred(condition, name) {
    return this.conditionHasOperatorForName(condition, name, "> 100");
  }

  conditionTargetsGreaterThanOne(condition, name) {
    return this.conditionHasOperatorForName(condition, name, "> 1");
  }

  conditionTargetsLessThanMinusHundred(condition, name) {
    return this.conditionHasOperatorForName(condition, name, "< -100");
  }

  conditionTargetsEqualsZero(condition, name) {
    return (
      this.conditionHasOperatorForName(condition, name, "=== 0") ||
      this.conditionHasOperatorForName(condition, name, "== 0")
    );
  }

  conditionHasOperatorForName(condition, name, operatorText) {
    if (!name) return condition.includes(operatorText);

    const escaped = this.escapeRegExp(name);
    const compact = String(operatorText).replace(/\s+/g, "\\s*");

    return new RegExp(
      `(?:^|[^A-Za-z0-9_$])(?:[A-Za-z_$][\\w$]*\\.)?${escaped}\\s*${compact}`
    ).test(condition);
  }

  shouldBeArrayParameter(parameterName, context = {}) {
    const name = String(parameterName || "").toLowerCase();

    if (
      this.extractKnownPaths(context).some((path) =>
        this.sameName(path.root, parameterName)
      )
    ) {
      return false;
    }

    return (
      /\b(list|array|collection|items|records|rows|entries)\b/i.test(
        parameterName
      ) ||
      (name.endsWith("s") && !name.endsWith("ss"))
    );
  }

  shouldBeObjectParameter(parameterName, context = {}) {
    const name = String(parameterName || "").toLowerCase();

    if (this.scalarNameLooksNumeric(name)) return false;
    if (this.scalarNameLooksString(name)) return false;

    if (this.semanticNameLooksObject(name)) return true;

    return this.extractKnownPaths(context).some((path) =>
      this.sameName(path.root, parameterName)
    );
  }

  semanticNameLooksObject(name) {
    const tokens = this.nameTokens(name);

    const objectTokens = new Set([
      "order",
      "position",
      "account",
      "portfolio",
      "client",
      "customer",
      "user",
      "instrument",
      "asset",
      "security",
      "record",
      "entity",
      "item",
      "product",
      "request",
      "response",
      "payload",
      "config",
      "settings",
      "options",
      "context",
      "event",
      "transaction"
    ]);

    return [...tokens].some((token) => objectTokens.has(token));
  }

  scalarNameLooksNumeric(name) {
    const tokens = this.nameTokens(name);

    const numericTokens = new Set([
      "quantity",
      "count",
      "price",
      "amount",
      "value",
      "balance",
      "cash",
      "total",
      "index",
      "day",
      "rate",
      "percent",
      "percentage",
      "ratio",
      "age",
      "number",
      "size",
      "length",
      "fee",
      "fees",
      "cost",
      "charge",
      "charges",
      "tax",
      "dividend",
      "share",
      "shares",
      "unit",
      "units",
      "limit",
      "threshold",
      "minimum",
      "maximum",
      "min",
      "max",
      "per",
      "exposure",
      "asset",
      "assets",
      "capital",
      "funds"
    ]);

    return [...tokens].some((token) => numericTokens.has(token));
  }

  scalarNameLooksString(name) {
    const tokens = this.nameTokens(name);

    const stringTokens = new Set([
      "currency",
      "symbol",
      "ticker",
      "code",
      "name",
      "email",
      "status",
      "state",
      "type",
      "side",
      "direction",
      "action",
      "id",
      "date",
      "market",
      "exchange",
      "country",
      "locale",
      "tier",
      "level",
      "account",
      "portfolio",
      "position",
      "order",
      "client",
      "customer",
      "user",
      "instrument",
      "isin",
      "sku",
      "description",
      "label"
    ]);

    return [...tokens].some((token) => stringTokens.has(token));
  }

  nameTokens(name) {
    const raw = String(name || "");

    return new Set(
      raw
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        .replace(/[_\-\s]+/g, " ")
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
    );
  }

  extractRequiredPropertiesForRoot(rootName, context = {}) {
    const properties = new Set();

    for (const path of this.extractKnownPaths(context)) {
      if (this.sameName(path.root, rootName) && path.properties.length > 0) {
        properties.add(path.properties[0]);
      }
    }

    return [...properties];
  }

  extractKnownPaths(context = {}) {
    const sources = [
      context.condition,
      context.body,
      context.source,
      context.returnExpression,
      ...(Array.isArray(context.conditions) ? context.conditions : [])
    ].filter(Boolean);

    const paths = [];

    for (const source of sources) {
      for (const path of this.extractConditionPaths(source)) {
        paths.push({ ...path, source });
      }
    }

    return this.dedupePaths(paths);
  }

  extractConditionPaths(sourceText) {
    const text = String(sourceText || "");
    const paths = [];
    const pattern =
      /\b([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\b/g;

    let match;

    while ((match = pattern.exec(text)) !== null) {
      const root = match[1];
      const properties = match[2].split(".").filter(Boolean);

      if (!root || properties.length === 0) continue;

      paths.push({
        root,
        properties,
        raw: match[0]
      });
    }

    return paths;
  }

  extractAllowedStringValueForName(name, context = {}) {
    const sourceName = String(name || "");

    if (this.scalarNameLooksNumeric(sourceName)) {
      return null;
    }

    const sources = [
      context.condition,
      context.body,
      context.source,
      context.returnExpression,
      ...(Array.isArray(context.conditions) ? context.conditions : [])
    ].filter(Boolean);

    const escapedName = this.escapeRegExp(sourceName);

    const patterns = [
      new RegExp(
        `\\[([^\\]]+)\\]\\.includes\\s*\\(\\s*(?:String\\s*\\(\\s*)?(?:[A-Za-z_$][\\w$]*\\.)?${escapedName}`,
        "i"
      ),
      new RegExp(
        `(?:[A-Za-z_$][\\w$]*\\.)?${escapedName}\\s*={2,3}\\s*["'\`]([^"'\`]+)["'\`]`,
        "i"
      )
    ];

    for (const source of sources) {
      for (const pattern of patterns) {
        const match = String(source).match(pattern);

        if (!match) continue;

        if (match[1] && match[1].includes(",")) {
          const firstLiteral = match[1].match(/["'`]([^"'`]+)["'`]/);
          if (firstLiteral) return firstLiteral[1];
        }

        if (match[1] && !match[1].includes(",")) {
          return match[1];
        }
      }
    }

    return null;
  }

  findBestParameterIndex(parameters = [], condition = "") {
    const loweredCondition = String(condition || "").toLowerCase();

    let bestIndex = -1;
    let bestScore = 0;

    parameters.forEach((parameterName, index) => {
      const loweredParameter = String(parameterName || "").toLowerCase();
      let score = 0;

      if (loweredCondition.includes(loweredParameter)) score += 10;

      for (const token of this.tokeniseName(loweredParameter)) {
        if (token && loweredCondition.includes(token)) score += 2;
      }

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    return bestIndex;
  }

  findParameterIndex(parameters = [], parameterName = "") {
    const wanted = String(parameterName || "").toLowerCase();

    return parameters.findIndex((parameter) => this.sameName(parameter, wanted));
  }

  resolvePathFromArgs(pathExpression, parameters, args) {
    const parts = String(pathExpression || "").split(".");
    const rootIndex = this.findParameterIndex(parameters, parts[0]);

    if (rootIndex === -1) return undefined;

    let current = args[rootIndex];

    for (const part of parts.slice(1)) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }

    return current;
  }

  setPathValue(target, propertyPath, value) {
    if (!target || typeof target !== "object") return;

    let current = target;

    for (const property of propertyPath.slice(0, -1)) {
      if (!this.isPlainObject(current[property])) {
        current[property] = {};
      }

      current = current[property];
    }

    current[propertyPath[propertyPath.length - 1]] = value;
  }

  defaultObject(name = "") {
    return {
      id: `${String(name || "entity").toLowerCase()}-1`,
      name: "value",
      type: "STANDARD",
      status: "ACTIVE",
      value: 100
    };
  }

  singularise(name) {
    const value = String(name || "");

    if (value.endsWith("ies")) return `${value.slice(0, -3)}y`;
    if (value.endsWith("s") && !value.endsWith("ss")) return value.slice(0, -1);

    return value;
  }

  sameName(a, b) {
    return String(a || "").toLowerCase() === String(b || "").toLowerCase();
  }

  normaliseIdentifier(value) {
    return String(value || "")
      .replace(/[^A-Za-z0-9_$]+/g, "")
      .toLowerCase();
  }

  dedupePaths(paths) {
    const seen = new Set();
    const result = [];

    for (const path of paths) {
      const key = `${path.root}.${path.properties.join(".")}`;

      if (seen.has(key)) continue;

      seen.add(key);
      result.push(path);
    }

    return result;
  }

  isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  deepClone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  escapeRegExp(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  tokeniseName(name) {
    return [...this.nameTokens(name)];
  }

  stringifyValueForJavascript(value) {
    if (value === undefined) return "undefined";
    return JSON.stringify(value, null, 2);
  }

  stringifyValueForPython(value) {
    if (value === null) return "None";
    if (value === undefined) return "None";
    if (value === true) return "True";
    if (value === false) return "False";

    return JSON.stringify(value, null, 2)
      .replace(/\btrue\b/g, "True")
      .replace(/\bfalse\b/g, "False")
      .replace(/\bnull\b/g, "None");
  }

  stringifyValue(value, language = "javascript") {
    if (language === "python") {
      return this.stringifyValueForPython(value);
    }

    return this.stringifyValueForJavascript(value);
  }
}