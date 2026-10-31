Include %occStatus
/// Manual business-service ingress suitable for a deterministic end-to-end demo.
/// SubmitJSON must be called on an instance created via Ens.Director.CreateBusinessService.
Class GraphFraud.Interop.IngestService Extends Ens.BusinessService
{
Method SubmitJSON(pJSON As %String, Output pReport As GraphFraud.Msg.CaseReport) As %Status
{
  Set req = ##class(GraphFraud.Msg.BatchRequest).%New()
  Set req.PayloadJSON = pJSON
  Quit ..SendRequestSync("GraphFraud.Router",req,.pReport,60)
}
}
