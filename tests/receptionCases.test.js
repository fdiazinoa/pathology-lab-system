import test from 'node:test';
import assert from 'node:assert/strict';
import { pendingReceptions, searchReceptions, receptionExamId } from '../src/services/receptionCases.js';
import { caseReportMetadata, caseWithReport } from '../src/services/caseReportMetadata.js';
const receipt = (id, date, extra = {}) => ({ id, patientId: 'patient', status: 'Borrador', source: 'reception', receivedAt: date, ...extra });
test('patient selection only offers their pending receipts, newest first, without mutating cases', () => {
    const cases = [receipt('old','2026-10-01'), receipt('new','2026-10-15'),receipt('other','2026-10-15',{patientId:'other'}), receipt('final','2026-10-16',{status:'Finalizado'}),receipt('started','2026-10-16',{receptionStatus:'in_progress'}),receipt('report','2026-10-16',{diagnosis:'Previous diagnosis'}), {id:'ordinary',patientId:'patient',status:'Borrador'}];
    assert.deepEqual(pendingReceptions(cases,'patient').map(item=>item.id),['new','old']);
    assert.equal(cases[0].id,'old');
    assert.equal(pendingReceptions(cases,'unknown').length,0);
});
test('reception search supports multiple terms, patient document and doctor accents', () => {
    const cases = [receipt('one','2026-10-15',{case_number:'C-2026-000001',type:'Biopsia',doctorId:'doctor'})];
    const patients = [{id:'patient',name:'Paciente Prueba',cedula:'TEST-123'}];
    const doctors = [{id:'doctor',name:'Médico Prueba'}];
    assert.equal(searchReceptions(cases,'medico biopsia TEST-123',patients,doctors).length,1);
    assert.equal(searchReceptions(cases,'2026-10-15 000001',patients,doctors).length,1);
    assert.equal(searchReceptions(cases,'citología',patients,doctors).length,0);
});
test('exam is assigned only for an unambiguous exact catalog match', () => {
    const exams = [{id:'b',name:'Biopsia'},{id:'c',name:'Citología'}];
    assert.equal(receptionExamId({type:'Citologia'},exams),'c');
    assert.equal(receptionExamId({type:'Biopsia'},[...exams,{id:'b2',name:'Biopsia'}]),'');
    assert.equal(receptionExamId({type:'Biopsia',examId:'b2'},[...exams,{id:'b2',name:'Biopsia'}]),'b2');
});
test('reception data survives save reload and continuation under the same case identity', () => {
    const record=receipt('persisted-id','2026-10-15T12:00:00Z',{sampleId:'S-TEST',originCenterId:'center',originCenter:'Centro Prueba',collectionDate:'2026-10-15T08:00',doctorId:'doctor',priority:'Urgente',paymentType:'Asegurado',arsName:'Seguro Prueba',policyNumber:'TEST-001',clinicalData:'Observaciones sintéticas'});
    const metadata=JSON.parse(JSON.stringify(caseReportMetadata(record)));
    const loaded=caseWithReport({id:record.id,patient_id:record.patientId,metadata,payment_method:'Asegurado'});
    for(const field of ['id','sampleId','originCenterId','originCenter','collectionDate','doctorId','priority','paymentType','arsName','policyNumber','clinicalData','source','receivedAt']) assert.equal(loaded[field],record[field],field);
    const continued=caseWithReport({id:loaded.id,patient_id:loaded.patientId,metadata:caseReportMetadata({receptionStatus:'in_progress',macroscopy:'Texto sintético'},metadata)});
    assert.equal(continued.id,'persisted-id');
    assert.equal(continued.sampleId,'S-TEST');
    assert.equal(pendingReceptions([continued]).length,0);
});
