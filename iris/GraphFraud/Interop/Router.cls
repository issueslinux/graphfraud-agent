Include %occStatus
/// BP: evidence retrieval from BO, then AI Hub agent prioritizes investigator review.
Class GraphFraud.Interop.Router Extends Ens.BusinessProcess
{
Method OnRequest(pRequest As GraphFraud.Msg.BatchRequest,
                 Output pResponse As GraphFraud.Msg.CaseReport) As %Status
{
  Set tSC = ..SendRequestSync("GraphFraud.Score",pRequest,.pResponse,40)
  Quit:$$$ISERR(tSC) tSC
  If '$IsObject(pResponse) Quit $System.Status.Error(5001,"GraphFraud.Score returned no response")
  Set evidence = ##class(%DynamicAbstractObject).%FromJSON(pResponse.EvidenceJSON)
  Set count = evidence.%Get("case_count")
  // Never present a bounded / truncated graph search as a clean screening result.
  // This branch precedes both MONITOR and the AI decision, regardless of count.
  If evidence.%Get("analysis_truncated") {
    Set pResponse.Decision = "INCOMPLETE_REVIEW"
    Set pResponse.AgentExplanation = "Search limit reached. Graph analysis is incomplete; human review required."
    Set pResponse.AgentUsed = 0
    Quit $$$OK
  }
  If count<1 {
    Set pResponse.Decision = "MONITOR"
    Set pResponse.AgentExplanation = "No defined graph indicator found in this batch."
    Quit $$$OK
  }
  // Conservative fallback when the model, key, provider or JSON is unavailable.
  Set pResponse.Decision = "STANDARD_REVIEW"
  Set pResponse.AgentExplanation = "AI Hub unavailable or response invalid; human review remains required."
  Set pResponse.AgentUsed = 0
  Try {
    Set agent = ##class(GraphFraud.Agent.RiskReviewer).%New()
    Set tInit = agent.%Init()
    If $$$ISERR(tInit) Quit $$$OK
    Set session = agent.CreateSession()
    Set reply = agent.Chat(session,
      "Classify investigation priority for these machine-detected indicators. "_
      "They are not proof of fraud. Reply with PRIORITY=HIGH or PRIORITY=STANDARD only. "_
      pResponse.EvidenceJSON)
    If '$IsObject(reply) Quit $$$OK
    Set answer = $ZStrip(reply.Content,"<>W")
    If answer="PRIORITY=HIGH" {
      Set pResponse.Decision = "HIGH_PRIORITY_REVIEW"
      Set pResponse.AgentUsed = 1
      Set pResponse.AgentExplanation = "IRIS AI Hub agent chose HIGH investigation priority."
    } ElseIf answer="PRIORITY=STANDARD" {
      Set pResponse.Decision = "STANDARD_REVIEW"
      Set pResponse.AgentUsed = 1
      Set pResponse.AgentExplanation = "IRIS AI Hub agent chose STANDARD investigation priority."
    }
  } Catch ex {
    // Never skip human review because an external provider failed.
    Set pResponse.AgentExplanation = "AI Hub failed or timed out; human review retained."
  }
  Quit $$$OK
}
}
