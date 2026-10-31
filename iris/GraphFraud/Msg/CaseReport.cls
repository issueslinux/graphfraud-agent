/// Serialized evidence and model routing; not a fraud verdict.
Class GraphFraud.Msg.CaseReport Extends Ens.Response
{
Property EvidenceJSON As %String(MAXLEN = 250000);
Property Decision As %String(MAXLEN = 40);
Property AgentExplanation As %String(MAXLEN = 4000);
Property AgentUsed As %Boolean;
}
