// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
//
// Original code forked from https://github.com/Quramy/ts-graphql-plugin

import { decorateWithTemplateLanguageService } from 'typescript-template-language-service-decorator';
import * as ts from 'typescript/lib/tsserverlibrary';
import { loadConfiguration } from './configuration';
import { LanguageServiceLogger } from './logger';
import StyledTemplateLanguageService from './styled-template-language-service';
import { getSubstitutions } from './substituter';

class LanguageServiceFactory {
    public constructor(
        private readonly typescript: typeof ts
    ) { }

    public create(info: ts.server.PluginCreateInfo): ts.LanguageService {
        const logger = new LanguageServiceLogger(info);
        const config = loadConfiguration(info.config);

        logger.log('config: ' + JSON.stringify(config));

        return decorateWithTemplateLanguageService(this.typescript, info.languageService, new StyledTemplateLanguageService(this.typescript, config, logger), {
            tags: config.tags,
            enableForStringWithSubstitutions: true,
            getSubstitutions(templateString, spans): string {
                return getSubstitutions(templateString, spans);
            },
        }, { logger });
    }
}

export = (mod: { typescript: typeof ts }) => new LanguageServiceFactory(mod.typescript);