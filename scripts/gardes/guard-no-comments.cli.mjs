#!/usr/bin/env node
import { main } from './guard-no-comments.mjs';

process.exitCode = main(process.argv.slice(2));
