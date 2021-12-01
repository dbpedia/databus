# Model


## Group

| Example | JSON-LD Context| SHACL |
| ----------- | ----------- |---|
|     | Title       | |

<div style="-webkit-column-count: 2; -moz-column-count: 2; column-count: 2; -webkit-column-rule: 1px dotted #e0e0e0; -moz-column-rule: 1px dotted #e0e0e0; column-rule: 1px dotted #e0e0e0;">
    <div style="display: inline-block;">
        <h2>Good</h2>
        <pre><code class="language-c">int foo (void) 
{
    int i;
}
</code></pre>
    </div>
    <div style="display: inline-block;">
        <h2>Bad</h2>
        <pre><code class="language-c">int foo (void) {
    int i;
}
</code></pre>
    </div>
</div>


<table>
<tr>
<td> Status </td> <td> Response </td>
</tr>
<tr>
<td> 200 </td>
<td>
```json
json
{
    "id": 10,
    "username": "alanpartridge",
    "email": "alan@alan.com",
    "password_hash": "$2a$10$uhUIUmVWVnrBWx9rrDWhS.CPCWCZsyqqa8./whhfzBZydX7yvahHS",
    "password_salt": "$2a$10$uhUIUmVWVnrBWx9rrDWhS.",
    "created_at": "2015-02-14T20:45:26.433Z",
    "updated_at": "2015-02-14T20:45:26.540Z"
}
```
V Extra blank line below!

</td>
</tr>
<tr>
<td> 400 </td>
<td>

**Markdown** _here_. (Blank lines needed before and after!)

</td>
</tr>
</table>