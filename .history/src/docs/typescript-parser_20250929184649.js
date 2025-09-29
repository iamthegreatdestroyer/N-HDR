/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * TypeScript and JSX parser for documentation system.
 */

const ts = require('typescript');
const { parse: babelParse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { Project } = require('ts-morph');

class TypescriptParser {
  /**
   * Create new TypeScript parser
   * @param {Object} options - Parser options
   */
  constructor(options = {}) {
    this.options = {
      tsConfigPath: options.tsConfigPath,
      jsxFactory: options.jsxFactory || 'React.createElement',
      jsxFragmentFactory: options.jsxFragmentFactory || 'React.Fragment',
      ...options
    };

    // Initialize TypeScript project
    this.project = new Project({
      tsConfigFilePath: this.options.tsConfigPath,
      skipAddingFilesFromTsConfig: true
    });
  }

  /**
   * Parse TypeScript/JSX file
   * @param {string} filePath - File path
   * @param {string} content - File content
   * @returns {Object} Parsed documentation
   */
  async parse(filePath, content) {
    const sourceFile = this.project.createSourceFile(filePath, content, {
      overwrite: true
    });

    const documentation = {
      classes: [],
      interfaces: [],
      types: [],
      functions: [],
      jsx: {
        components: [],
        hooks: []
      }
    };

    // Parse TypeScript declarations
    this._parseTypeScriptDeclarations(sourceFile, documentation);

    // Parse JSX if present
    if (this._isJsxFile(filePath)) {
      this._parseJsx(content, documentation);
    }

    return documentation;
  }

  /**
   * Parse TypeScript declarations
   * @param {ts.SourceFile} sourceFile - TypeScript source file
   * @param {Object} documentation - Documentation object
   * @private
   */
  _parseTypeScriptDeclarations(sourceFile, documentation) {
    // Parse classes
    sourceFile.getClasses().forEach(classDecl => {
      const classDoc = {
        name: classDecl.getName(),
        description: this._getJsDoc(classDecl),
        properties: this._getClassProperties(classDecl),
        methods: this._getClassMethods(classDecl),
        typeParameters: this._getTypeParameters(classDecl),
        decorators: this._getDecorators(classDecl),
        implements: classDecl.getImplements().map(imp => imp.getText()),
        extends: classDecl.getExtends()?.getText()
      };
      documentation.classes.push(classDoc);
    });

    // Parse interfaces
    sourceFile.getInterfaces().forEach(interfaceDecl => {
      const interfaceDoc = {
        name: interfaceDecl.getName(),
        description: this._getJsDoc(interfaceDecl),
        properties: this._getInterfaceProperties(interfaceDecl),
        methods: this._getInterfaceMethods(interfaceDecl),
        typeParameters: this._getTypeParameters(interfaceDecl),
        extends: interfaceDecl.getExtends().map(ext => ext.getText())
      };
      documentation.interfaces.push(interfaceDoc);
    });

    // Parse type aliases
    sourceFile.getTypeAliases().forEach(typeAlias => {
      const typeDoc = {
        name: typeAlias.getName(),
        description: this._getJsDoc(typeAlias),
        type: typeAlias.getType().getText(),
        typeParameters: this._getTypeParameters(typeAlias)
      };
      documentation.types.push(typeDoc);
    });

    // Parse functions
    sourceFile.getFunctions().forEach(func => {
      const functionDoc = {
        name: func.getName(),
        description: this._getJsDoc(func),
        parameters: this._getFunctionParameters(func),
        returnType: func.getReturnType().getText(),
        typeParameters: this._getTypeParameters(func),
        decorators: this._getDecorators(func)
      };
      documentation.functions.push(functionDoc);
    });
  }

  /**
   * Parse JSX content
   * @param {string} content - File content
   * @param {Object} documentation - Documentation object
   * @private
   */
  _parseJsx(content, documentation) {
    const ast = babelParse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });

    traverse(ast, {
      // Parse React components
      FunctionDeclaration: path => {
        if (this._isReactComponent(path)) {
          documentation.jsx.components.push(this._parseComponent(path));
        }
      },
      ArrowFunctionExpression: path => {
        if (this._isReactComponent(path)) {
          documentation.jsx.components.push(this._parseComponent(path));
        }
      },
      // Parse React hooks
      CallExpression: path => {
        if (this._isReactHook(path)) {
          documentation.jsx.hooks.push(this._parseHook(path));
        }
      }
    });
  }

  /**
   * Get JSDoc comment for node
   * @param {ts.Node} node - TypeScript node
   * @returns {string} JSDoc comment
   * @private
   */
  _getJsDoc(node) {
    const jsDoc = node.getJsDocs()[0];
    return jsDoc ? jsDoc.getDescription().trim() : '';
  }

  /**
   * Get class properties
   * @param {ts.ClassDeclaration} classDecl - Class declaration
   * @returns {Array} Class properties
   * @private
   */
  _getClassProperties(classDecl) {
    return classDecl.getProperties().map(prop => ({
      name: prop.getName(),
      description: this._getJsDoc(prop),
      type: prop.getType().getText(),
      decorators: this._getDecorators(prop),
      accessibility: prop.getScope()?.getText(),
      isStatic: prop.isStatic(),
      isReadonly: prop.isReadonly(),
      defaultValue: prop.getInitializer()?.getText()
    }));
  }

  /**
   * Get class methods
   * @param {ts.ClassDeclaration} classDecl - Class declaration
   * @returns {Array} Class methods
   * @private
   */
  _getClassMethods(classDecl) {
    return classDecl.getMethods().map(method => ({
      name: method.getName(),
      description: this._getJsDoc(method),
      parameters: this._getFunctionParameters(method),
      returnType: method.getReturnType().getText(),
      decorators: this._getDecorators(method),
      accessibility: method.getScope()?.getText(),
      isStatic: method.isStatic(),
      isAsync: method.isAsync()
    }));
  }

  /**
   * Get interface properties
   * @param {ts.InterfaceDeclaration} interfaceDecl - Interface declaration
   * @returns {Array} Interface properties
   * @private
   */
  _getInterfaceProperties(interfaceDecl) {
    return interfaceDecl.getProperties().map(prop => ({
      name: prop.getName(),
      description: this._getJsDoc(prop),
      type: prop.getType().getText(),
      isOptional: prop.hasQuestionToken()
    }));
  }

  /**
   * Get interface methods
   * @param {ts.InterfaceDeclaration} interfaceDecl - Interface declaration
   * @returns {Array} Interface methods
   * @private
   */
  _getInterfaceMethods(interfaceDecl) {
    return interfaceDecl.getMethods().map(method => ({
      name: method.getName(),
      description: this._getJsDoc(method),
      parameters: this._getFunctionParameters(method),
      returnType: method.getReturnType().getText(),
      isOptional: method.hasQuestionToken()
    }));
  }

  /**
   * Get function parameters
   * @param {ts.Node} node - Function-like declaration
   * @returns {Array} Function parameters
   * @private
   */
  _getFunctionParameters(node) {
    return node.getParameters().map(param => ({
      name: param.getName(),
      description: this._getJsDoc(param),
      type: param.getType().getText(),
      isOptional: param.hasQuestionToken(),
      defaultValue: param.getInitializer()?.getText()
    }));
  }

  /**
   * Get type parameters
   * @param {ts.Node} node - Node with type parameters
   * @returns {Array} Type parameters
   * @private
   */
  _getTypeParameters(node) {
    return node.getTypeParameters().map(param => ({
      name: param.getName(),
      constraint: param.getConstraint()?.getText(),
      default: param.getDefault()?.getText()
    }));
  }

  /**
   * Get decorators
   * @param {ts.Node} node - Node with decorators
   * @returns {Array} Decorators
   * @private
   */
  _getDecorators(node) {
    return node.getDecorators().map(decorator => ({
      name: decorator.getName(),
      arguments: decorator.getArguments().map(arg => arg.getText())
    }));
  }

  /**
   * Check if file contains JSX
   * @param {string} filePath - File path
   * @returns {boolean} True if JSX file
   * @private
   */
  _isJsxFile(filePath) {
    return /\.(tsx|jsx)$/.test(filePath);
  }

  /**
   * Check if node is React component
   * @param {Object} path - AST path
   * @returns {boolean} True if React component
   * @private
   */
  _isReactComponent(path) {
    // Check function return type for JSX.Element
    const returnType = path.node.returnType;
    if (returnType?.typeAnnotation?.type === 'TSTypeReference') {
      const typeName = returnType.typeAnnotation.typeName;
      if (typeName.name === 'JSX' || typeName.name === 'ReactElement') {
        return true;
      }
    }

    // Check for React.FC or FunctionComponent type annotation
    const typeAnnotation = path.node.typeAnnotation;
    if (typeAnnotation?.typeAnnotation?.type === 'TSTypeReference') {
      const typeName = typeAnnotation.typeAnnotation.typeName;
      if (typeName.name === 'FC' || typeName.name === 'FunctionComponent') {
        return true;
      }
    }

    // Check if function returns JSX
    let returnsJsx = false;
    path.traverse({
      ReturnStatement(returnPath) {
        if (returnPath.node.argument?.type?.includes('JSX')) {
          returnsJsx = true;
        }
      }
    });

    return returnsJsx;
  }

  /**
   * Check if node is React hook
   * @param {Object} path - AST path
   * @returns {boolean} True if React hook
   * @private
   */
  _isReactHook(path) {
    const callee = path.node.callee;
    return (
      callee.type === 'Identifier' &&
      callee.name.startsWith('use') &&
      callee.name[3] === callee.name[3].toUpperCase()
    );
  }

  /**
   * Parse React component
   * @param {Object} path - AST path
   * @returns {Object} Component documentation
   * @private
   */
  _parseComponent(path) {
    return {
      name: path.node.id?.name,
      description: this._getLeadingComments(path.node),
      props: this._parseComponentProps(path),
      hooks: this._findHooksInComponent(path),
      file: path.hub.file.opts.filename
    };
  }

  /**
   * Parse React hook
   * @param {Object} path - AST path
   * @returns {Object} Hook documentation
   * @private
   */
  _parseHook(path) {
    return {
      name: path.node.callee.name,
      description: this._getLeadingComments(path.node),
      dependencies: this._getHookDependencies(path),
      file: path.hub.file.opts.filename
    };
  }

  /**
   * Get leading comments
   * @param {Object} node - AST node
   * @returns {string} Comments
   * @private
   */
  _getLeadingComments(node) {
    const comments = node.leadingComments || [];
    return comments
      .map(comment => comment.value.trim())
      .filter(comment => comment.startsWith('*'))
      .map(comment => comment.slice(1).trim())
      .join('\n');
  }

  /**
   * Parse component props
   * @param {Object} path - AST path
   * @returns {Array} Props documentation
   * @private
   */
  _parseComponentProps(path) {
    const props = [];
    
    // Handle props parameter destructuring
    path.get('params').forEach(param => {
      if (param.isObjectPattern()) {
        param.node.properties.forEach(prop => {
          props.push({
            name: prop.key.name,
            required: !prop.optional,
            type: prop.typeAnnotation?.typeAnnotation?.type,
            defaultValue: prop.value?.value
          });
        });
      }
    });

    return props;
  }

  /**
   * Find hooks in component
   * @param {Object} path - AST path
   * @returns {Array} Hooks documentation
   * @private
   */
  _findHooksInComponent(path) {
    const hooks = [];
    path.traverse({
      CallExpression(callPath) {
        if (this._isReactHook(callPath)) {
          hooks.push(this._parseHook(callPath));
        }
      }
    });
    return hooks;
  }

  /**
   * Get hook dependencies
   * @param {Object} path - AST path
   * @returns {Array} Hook dependencies
   * @private
   */
  _getHookDependencies(path) {
    const deps = [];
    const depsArg = path.node.arguments[path.node.arguments.length - 1];
    
    if (depsArg?.type === 'ArrayExpression') {
      depsArg.elements.forEach(element => {
        if (element.type === 'Identifier') {
          deps.push(element.name);
        }
      });
    }
    
    return deps;
  }
}

module.exports = TypescriptParser;