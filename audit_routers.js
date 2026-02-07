
import fs from 'fs';
import path from 'path';

const routesDir = 'src/routes';
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));

console.log('--- Router Export Audit ---');

for (const file of files) {
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const hasDefaultExport = content.includes('export default');
    const hasNamedRouterExport = content.includes('export const router') || content.includes('export { router }');
    const hasNamedAuditRouterExport = content.includes('export const auditRouter') || content.includes('export { auditRouter }');

    let report = `[${file}] `;
    if (hasDefaultExport) report += 'DEFAULT ';
    if (hasNamedRouterExport) report += 'NAMED(router) ';
    if (hasNamedAuditRouterExport) report += 'NAMED(auditRouter) ';

    if (!hasDefaultExport && !hasNamedRouterExport && !hasNamedAuditRouterExport) {
        report += '!!! NO EXPORTS FOUND !!!';
    }

    console.log(report);
}
