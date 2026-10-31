Include %occStatus
/// HTTP BO: delegates bounded graph motif extraction to the isolated Node evidence service.
Class GraphFraud.Interop.ScoreOperation Extends Ens.BusinessOperation
{
Parameter ADAPTER = "EnsLib.HTTP.OutboundAdapter";
Parameter INVOCATION = "Queue";

XData MessageMap
{
<MapItems>
  <MapItem MessageType="GraphFraud.Msg.BatchRequest">
    <Method>ScoreBatch</Method>
  </MapItem>
</MapItems>
}

Method ScoreBatch(pRequest As GraphFraud.Msg.BatchRequest,
                  Output pResponse As GraphFraud.Msg.CaseReport) As %Status
{
  Set pResponse = ##class(GraphFraud.Msg.CaseReport).%New()
  Set pResponse.Decision = "HUMAN_REVIEW"
  Set pResponse.AgentUsed = 0
  Try {
    Set sc = ..Adapter.Post(.httpResponse, "", pRequest.PayloadJSON)
    If $$$ISERR(sc) Quit sc
    If '$IsObject(httpResponse) Quit $System.Status.Error(5001,"Missing evidence response")
    If httpResponse.StatusCode '= 200 {
      Quit $System.Status.Error(5001,"Graph evidence service returned HTTP "_httpResponse.StatusCode)
    }
    If '$IsObject(httpResponse.Data) Quit $System.Status.Error(5001,"Evidence response has no body")
    Do httpResponse.Data.Rewind()
    Set text = ""
    While 'httpResponse.Data.AtEnd {
      Set text = text_httpResponse.Data.Read(32000)
      If $Length(text)>250000 Quit $System.Status.Error(5001,"Evidence response too long")
    }
    Set proof = ##class(%DynamicAbstractObject).%FromJSON(text)
    If proof.%Get("schema_version") '="1.0" Quit $System.Status.Error(5001,"Unsupported evidence schema")
    Set pResponse.EvidenceJSON = text
    Quit $$$OK
  } Catch ex {
    Quit ex.AsStatus()
  }
}
}
