/// Incoming JSON batch for the graph investigation. No live payments are initiated.
Class GraphFraud.Msg.BatchRequest Extends Ens.Request
{
Property PayloadJSON As %String(MAXLEN = 250000);
}
