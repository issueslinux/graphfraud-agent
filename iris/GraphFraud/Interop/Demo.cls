Include %occStatus
/// One-command manual example executed from the USER namespace while the production runs.
Class GraphFraud.Interop.Demo Extends %RegisteredObject
{
ClassMethod Run() As %Status
{
  Set file = ##class(%Stream.FileCharacter).%New()
  Set sc = file.LinkToFile("/opt/graphfraud/demo_batch.json")
  Quit:$$$ISERR(sc) sc
  Set text = ""
  While 'file.AtEnd {
    Set text = text_file.Read(32000)
    If $Length(text)>250000 Quit $System.Status.Error(5001,"Demo batch too large")
  }
  Set sc = ##class(Ens.Director).CreateBusinessService("GraphFraud.Inbound",.svc)
  Quit:$$$ISERR(sc) sc
  Set sc = svc.SubmitJSON(text,.report)
  Quit:$$$ISERR(sc) sc
  Write "GraphFraud decision: ",report.Decision,!
  Write "IRIS AI Hub used: ",report.AgentUsed,!
  If report.AgentUsed=1 Write "GRAPHFRAUD_AI_HUB_USED",!
  Write "Agent outcome: ",report.AgentExplanation,!
  Write "Deterministic graph evidence: ",report.EvidenceJSON,!
  Quit $$$OK
}
}
