import * as ts from 'typescript/lib/tsserverlibrary';
import { isTagged } from './nodes';
import Logger from './logger';

export interface ScriptSourceHelper {
    getAllNodes: (fileName: string, condition: (n: ts.Node) => boolean) => ts.Node[];
    getNode: (fileName: string, position: number) => ts.Node | undefined;
    getLineAndChar: (fileName: string, position: number) => ts.LineAndCharacter;
    getOffset(fileName: string, line: number, character: number): number;
}

type LanguageServiceMethodWrapper<K extends keyof ts.LanguageService>
    = (delegate: ts.LanguageService[K], info?: ts.server.PluginCreateInfo) => ts.LanguageService[K];

export interface TemplateContext {
    fileName: string;
    node: ts.Node;

    /**
     * Map a location from within the template string to an offset within the template string
     */
    toOffset(location: ts.LineAndCharacter): number;

    /**
     * Map an offset within the template string to a location within the template string
     */
    toPosition(offset: number): ts.LineAndCharacter;
}

class StandardTemplateContext implements TemplateContext {
    constructor(
        public readonly fileName: string,
        public readonly node: ts.Node,
        private readonly helper: ScriptSourceHelper,
    ) { }

    public toOffset(position: ts.LineAndCharacter): number {
        const docOffset = this.helper.getOffset(this.fileName,
            position.line + this.stringBodyPosition.line,
            position.line === 0 ? this.stringBodyPosition.character + position.character : position.character);
        return docOffset - this.stringBodyOffset;
    }

    public toPosition(offset: number): ts.LineAndCharacter {
        const docPosition = this.helper.getLineAndChar(this.fileName, this.stringBodyOffset + offset);
        return relative(this.stringBodyPosition, docPosition);
    }

    private get stringBodyOffset(): number {
        return this.node.getStart() + 1;
    }

    private get stringBodyPosition(): ts.LineAndCharacter {
        return this.helper.getLineAndChar(this.fileName, this.stringBodyOffset);
    }
}

function relative(from: ts.LineAndCharacter, to: ts.LineAndCharacter): ts.LineAndCharacter {
    return {
        line: to.line - from.line,
        character: to.line === from.line ? to.character - from.character : to.character,
    };
}

/**
 * 
 */
export interface TemplateStringLanguageService {
    getCompletionsAtPosition?(
        body: string,
        position: ts.LineAndCharacter,
        context: TemplateContext,
    ): ts.CompletionInfo;

    getQuickInfoAtPosition?(
        body: string,
        position: ts.LineAndCharacter,
        context: TemplateContext,
    ): ts.QuickInfo | undefined;

    getSyntacticDiagnostics?(
        body: string,
        context: TemplateContext,
    ): ts.Diagnostic[];

    getSemanticDiagnostics?(
        body: string,
        context: TemplateContext,
    ): ts.Diagnostic[];
}

class TemplateLanguageServiceProxyBuilder {

    private _wrappers: any[] = [];

    constructor(
        private readonly helper: ScriptSourceHelper,
        private readonly templateStringService: TemplateStringLanguageService,
        private readonly logger: Logger,
        private readonly tags: string[],
    ) {
        if (templateStringService.getCompletionsAtPosition) {
            const call = templateStringService.getCompletionsAtPosition;
            this.wrap('getCompletionsAtPosition', delegate =>
                (fileName: string, position: number) => {
                    const node = this.getTemplateNode(fileName, position);
                    if (!node) {
                        return delegate(fileName, position);
                    }
                    const contents = node.getText().slice(1, -1);
                    return call.call(templateStringService,
                        contents,
                        this.getRelativePositionWithinNode(fileName, node, position),
                        new StandardTemplateContext(fileName, node, this.helper));
                });
        }

        if (templateStringService.getQuickInfoAtPosition) {
            const call = templateStringService.getQuickInfoAtPosition;
            this.wrap('getQuickInfoAtPosition', delegate =>
                (fileName: string, position: number): ts.QuickInfo => {
                    const node = this.getTemplateNode(fileName, position);
                    if (!node) {
                        return delegate(fileName, position);
                    }
                    const contents = node.getText().slice(1, -1);
                    const quickInfo: ts.QuickInfo | undefined = call.call(templateStringService,
                        contents,
                        this.getRelativePositionWithinNode(fileName, node, position),
                        new StandardTemplateContext(fileName, node, this.helper));
                    if (quickInfo) {
                        return Object.assign({}, quickInfo, {
                            textSpan:  {
                                start: quickInfo.textSpan.start + node.getStart() + 1,
                                length: quickInfo.textSpan.length
                            }
                        });
                    }
                    return delegate(fileName, position);
                });
        }

        if (templateStringService.getSemanticDiagnostics) {
            const call = templateStringService.getSemanticDiagnostics.bind(templateStringService);
            this.wrap('getSemanticDiagnostics', delegate =>
                (fileName: string) => {
                    return this.adapterDiagnosticsCall(delegate, call, fileName);
                });
        }

        if (templateStringService.getSyntacticDiagnostics) {
            const call = templateStringService.getSyntacticDiagnostics.bind(templateStringService);
            this.wrap('getSyntacticDiagnostics', delegate =>
                (fileName: string) => {
                    return this.adapterDiagnosticsCall(delegate, call, fileName);
                });
        }
    }

    public build(languageService: ts.LanguageService) {
        const ret: any = languageService;
        this._wrappers.forEach(({ name, wrapper }) => {
            ret[name] = wrapper((languageService as any)[name]);
        });
        return ret;
    }

    private wrap<K extends keyof ts.LanguageService>(name: K, wrapper: LanguageServiceMethodWrapper<K>) {
        this._wrappers.push({ name, wrapper });
        return this;
    }

    private getRelativePositionWithinNode(
        fileName: string,
        node: ts.Node,
        offset: number
    ): ts.LineAndCharacter {        
        const baseLC = this.helper.getLineAndChar(fileName, node.getStart() + 1);
        const cursorLC = this.helper.getLineAndChar(fileName, offset);
        return relative(baseLC, cursorLC);
    }

    private getTemplateNode(fileName: string, position: number): ts.Node | undefined {
        const node = this.helper.getNode(fileName, position);
        if (!node || node.kind !== ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
            return undefined;
        }
        if (isTagged(node, this.tags)) {
            return node;
        }
        return undefined;
    }

    private getAllTemplateNodes(fileName: string): ts.Node[] {
        return this.helper.getAllNodes(fileName, node =>
            node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral && isTagged(node, this.tags));
    }

    private adapterDiagnosticsCall(
        delegate: (fileName: string) => ts.Diagnostic[],
        implementation: (body: string, context: TemplateContext) => ts.Diagnostic[],
        fileName: string
    ) {
        const baseDiagnostics = delegate(fileName);
        const templateDiagnostics: ts.Diagnostic[] = [];
        for (const templateNode of this.getAllTemplateNodes(fileName)) {
            const contents = templateNode.getText().slice(1, -1);
            const diagnostics: ts.Diagnostic[] = implementation(
                contents,
                new StandardTemplateContext(fileName, templateNode, this.helper));

            for (const diagnostic of diagnostics) {
                templateDiagnostics.push(Object.assign({}, diagnostic, {
                    start: templateNode.getStart() + 1 + (diagnostic.start || 0),
                }));
            }
        }
        return [...baseDiagnostics, ...templateDiagnostics];        
    }
}

/**
 * 
 */
export function createTemplateStringLanguageServiceProxy(
    languageService: ts.LanguageService,
    helper: ScriptSourceHelper,
    templateStringService: TemplateStringLanguageService,
    logger: Logger,
    tags: string[],
): ts.LanguageService {
    return new TemplateLanguageServiceProxyBuilder(helper, templateStringService, logger, tags)
        .build(languageService);
}
